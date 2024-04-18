const express = require("express");
const cors = require("cors");
const app = express();

require("dotenv").config();

app.use(express.json());
app.use(cors());

app.get("/api", require("./routes/userRoutes"));
app.get("/api/application-data", require("./routes/userRoutes"));
app.get("/api/pending-requests", require("./routes/userRoutes"));
app.post("/api/register", require("./routes/userRoutes"));
app.post("/api/login", require("./routes/userRoutes"));
app.post("/api/approve-request", require("./routes/userRoutes"));
app.post("/api/approve-deny", require("./routes/userRoutes"));
app.post("/api/deny-request/:id", require("./routes/userRoutes"));
app.post("/api/insert-student-details", require("./routes/userRoutes"));
app.post("/api/request-approval", require("./routes/userRoutes"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
