const express = require("express");
const userRoute = express.Router();
const {
  getApplicationData,
  getPendingRequests,
  approveRequest,
  approveDeny,
  denyRequest,
  insertStudentDetails,
  login,
  register,
  requestApproval,
  chk
} = require("../controllers/userController");

userRoute.route("/api").get(chk)
userRoute.route("/api/application-data").get(getApplicationData);

userRoute.route("/api/pending-requests").get(getPendingRequests);

userRoute.route("/api/approve-request").post(approveRequest);
userRoute.route("/api/approve-deny").post(approveDeny);
userRoute.route("/api/deny-request/:id").post(denyRequest);

userRoute.route("/api/register").post(register);

userRoute.route("/api/login").post(login);

userRoute.route("/api/insert-student-details").post(insertStudentDetails);

userRoute.route("/api/request-approval").post(requestApproval);

module.exports = userRoute;
