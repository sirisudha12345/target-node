const express = require("express");
const cookieParser = require("cookie-parser");
const TargetNodeClient = require("@adobe/target-node-client");
//const TargetNodeClient = require("@adobe/target-nodejs-sdk");
const CONFIG = {
  // client: "acmeclient",
  // organizationId: "1234567890@AdobeOrg"
  // client: "optisightsps",
  // organizationId: "636435DD5CF8FB400A495FCD@AdobeOrg"
  client: "sephora",
  organizationId: "D46B1DDB611D3FC50A495F8A@AdobeOrg"
};

const TEMPLATE = `
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Target Node Client NodeJS SDK Sample</title>
  <script src="VisitorAPI.js"></script>
  <script src="JQuery.js"></script>
  <script>
    Visitor.getInstance("{organizationId}", {serverState: {visitorState}});
  </script>
  <script>
    window.targetGlobalSettings = {
      overrideMboxEdgeServer: true
    };
  </script>
  <script src="at.js"></script>
</head>
<body>
  <p>{content}</p>
  <script src="AppMeasurement.js"></script>
  <script>var s_code=s.t();if(s_code)document.write(s_code);</script>
</body>
</html>
`;
 
const app = express();
const client = TargetNodeClient.create({config: CONFIG});
 
app.use(cookieParser());
// We assume that VisitorAPI.js, at.js and AppMeasurement.js is stored in "public" folder
app.use(express.static(__dirname + "/public"));
 
function saveCookie(res, cookie) {
  if (!cookie) {
    return;
  }
 
  res.cookie(cookie.name, cookie.value, {maxAge: cookie.maxAge * 1000});
}
 
function sendSuccessResponse(res, response) {
  res.set({
    "Content-Type": "text/html",
    "Expires": new Date().toUTCString()
  });
  console.log("Reponse", response);
 
  const result = TEMPLATE
  .replace("{organizationId}", CONFIG.organizationId)
  .replace("{visitorState}", JSON.stringify(response.visitorState))
  .replace("{content}", response.content.mboxResponses[0].content);
 
  saveCookie(res, response.targetCookie);
  saveCookie(res, response.targetLocationHintCookie);
 
  res.status(200).send(result);
}
 
function sendErrorResponse(res, error) {
  res.set({
    "Content-Type": "text/html",
    "Expires": new Date().toUTCString()
  });
 
  res.status(500).send(error);
}
 
app.get("/abtest", function (req, res) {
  const visitorCookieName = encodeURIComponent(TargetNodeClient.getVisitorCookieName(CONFIG.organizationId));
  const visitorCookie = req.cookies[visitorCookieName];
  const targetCookieName = encodeURIComponent(TargetNodeClient.getTargetCookieName());
  const targetCookie = req.cookies[targetCookieName];
  const targetLocationHintCookieName = encodeURIComponent(TargetNodeClient.getTargetLocationHintCookieName());
  const targetLocationHintCookie = req.cookies[targetLocationHintCookieName];
  const payload = {
      mboxes: [{
        mbox: "server-side-mbox",
        indexId: 0
      }]
    }
  const request = Object.assign({payload}, {targetCookie}, {visitorCookie}, {targetLocationHintCookie});
 
  
 
  client.getOffers(request)
  .then(response => {
    sendSuccessResponse(res, response);
  })
  .catch(error => {
    sendErrorResponse(res, error);
  });
});
 
app.listen(3000, function () {
  console.log("Listening on port 3000 and watching!");
});