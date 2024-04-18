const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});
pool.connect((err) => {
  if (err) throw err;
  console.log("Connect to PostgreSQL successfully!");
});

const chk = async (res) => {
  try {
    res.json({ success: true, message: "Backend working successfully" });
  } catch (error) {
    console.error("Error fetching application data:", error);
    res.json({ success: false, message: "Error fetching application data" });
  }
};

const getApplicationData = async (req, res) => {
  try {
    const query = "SELECT * FROM application";
    const { rows } = await pool.query(query);
    res.json({ success: true, applicationData: rows });
  } catch (error) {
    console.error("Error fetching application data:", error);
    res.json({ success: false, message: "Error fetching application data" });
  }
};

const requestApproval = async (req, res) => {
  try {
    const { rollNumber, departmentDetails } = req.body;
    if (!departmentDetails || !Array.isArray(departmentDetails)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request format",
      });
    }
    const checkQuery =
      "SELECT * FROM request_approval WHERE roll_number = $1 AND status = 'pending'";
    const checkResult = await pool.query(checkQuery, [rollNumber]);
    if (checkResult.rows.length > 0) {
      return res.json({
        success: false,
        message: "Request for approval is already pending.",
      });
    }
    let storedData;
    for (const detail of departmentDetails) {
      const insertQuery =
        "INSERT INTO request_approval (roll_number, department_name, status) VALUES ($1, $2, $3) RETURNING *";
      const result = await pool.query(insertQuery, [
        rollNumber,
        detail.department_name,
        detail.status,
      ]);
      storedData = result.rows[0];
    }
    res.json({
      success: true,
      message: "Request for approval sent and stored successfully.",
      timestamp: storedData.timestamp,
    });
  } catch (error) {
    console.error("Error handling request for approval:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const login = async (req, res) => {
  // console.log("Came");
  const { rollNumber, password } = req.body;
  // console.log(rollNumber, password);
  const rollNumberPattern = /^[0-9]{8}$/;

  if (!rollNumberPattern.test(rollNumber)) {
    return res.status(400).json({
      success: false,
      message: "Invalid roll number format",
    });
  }

  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,12}$/;

  if (!passwordPattern.test(password)) {
    return res.status(400).json({
      success: false,
      message: "Invalid password format",
    });
  }

  try {
    const adminQuery =
      "SELECT * FROM admin WHERE roll_number = $1 AND password = $2";
    // console.log(adminQuery);
    const adminResult = await pool.query(adminQuery, [rollNumber, password]);

    if (adminResult.rows.length > 0) {
      // const admin = adminResult.rows[0];
      // console.log(admin);
      const department = adminResult.rows[0].department;
      return res.status(200).json({
        success: true,
        message: "Admin login successful",
        isAdmin: true,
        department: department,
      });
    }

    const userQuery =
      "SELECT * FROM student_profile WHERE roll_number = $1 AND password = $2";
    const userResult = await pool.query(userQuery, [rollNumber, password]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      delete user.password;
      const departmentDetailsQuery =
        "SELECT * FROM department_details WHERE student_roll_number = $1";
      const departmentDetailsResult = await pool.query(departmentDetailsQuery, [
        rollNumber,
      ]);
      const departmentDetails = departmentDetailsResult.rows;
      return res.status(200).json({
        success: true,
        message: "Student login successful",
        user,
        departmentDetails,
      });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error checking user:", error);
    return res.status(500).json({ success: false, message: "Error occurred" });
  }
};

const register = async (req, res) => {
  try {
    const data = req.body;
    if (
      !data.rollNumber ||
      !data.name ||
      !data.photoURL ||
      !data.schoolOfStudy ||
      !data.admissionYear ||
      !data.address ||
      !data.contactNumber ||
      !data.email ||
      !data.password
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }
    const checkRollNumberQueryApplication =
      "SELECT * FROM application WHERE roll_number = $1 AND email_id = $2";
    const existingRollNumberApplication = await pool.query(
      checkRollNumberQueryApplication,
      [data.rollNumber, data.email]
    );
    if (existingRollNumberApplication.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Roll number and Email ID are already registered.  ",
      });
    }
    const checkRollNumberQueryStudentProfile =
      "SELECT * FROM student_profile WHERE roll_number = $1 ";
    const existingRollNumberStudentProfile = await pool.query(
      checkRollNumberQueryStudentProfile,
      [data.rollNumber]
    );
    if (existingRollNumberStudentProfile.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Roll number is already Existing.",
      });
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }
    const phoneNumberPattern = /^\d{10}$/;
    if (!phoneNumberPattern.test(data.contactNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number.",
      });
    }
    const insertProfileQuery =
      "INSERT INTO application (roll_number, student_name, photo_url, school_of_study, year_of_admission, address, contact_number, email_id, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *";
    const profileResult = await pool.query(insertProfileQuery, [
      data.rollNumber,
      data.name,
      data.photoURL,
      data.schoolOfStudy,
      data.admissionYear,
      data.address,
      data.contactNumber,
      data.email,
      data.password,
    ]);
    const storedData = {
      profileData: profileResult.rows[0],
    };
    return res.status(200).json({
      message: "Data received and stored successfully.",
      data: storedData,
      success: true,
    });
  } catch (error) {
    console.error("Error processing email:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const insertStudentDetails = async (req, res) => {
  try {
    const { id } = req.body;
    // console.log(id);
    const applicationQuery = "SELECT * FROM application WHERE id = $1";
    const applicationResult = await pool.query(applicationQuery, [id]);
    const applicationData = applicationResult.rows[0];

    if (!applicationData) {
      return res.status(404).json({
        success: false,
        message: "Application data not found for the provided roll number.",
      });
    }
    const insertQuery =
      "INSERT INTO student_profile (roll_number, student_name, photo_url, school_of_study, year_of_admission, address, contact_number, email_id, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *";
    const result = await pool.query(insertQuery, [
      applicationData.roll_number,
      applicationData.student_name,
      applicationData.photo_url,
      applicationData.school_of_study,
      applicationData.year_of_admission,
      applicationData.address,
      applicationData.contact_number,
      applicationData.email_id,
      applicationData.password,
    ]);
    const insertedData = result.rows[0];
    const deleteApplicationQuery = "DELETE FROM application WHERE id = $1";
    await pool.query(deleteApplicationQuery, [id]);

    res.json({
      success: true,
      message:
        "Inserted into student_profile table successfully. Application data deleted.",
      insertedData,
    });
  } catch (error) {
    console.error("Error inserting into student_profile table:", error);
    res.status(500).json({
      success: false,
      message: { error },
    });
  }
};
const getPendingRequests = async (req, res) => {
  try {
    const query =
      "SELECT * FROM request_approval WHERE status = 'pending' ORDER BY created_at";
    const result = await pool.query(query);
    res.json({ success: true, requests: result.rows });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const approveRequest = async (req, res) => {
  try {
    const { id, applicationData, department_name } = req.body;
    const updateQuery =
      "UPDATE department_details SET status = 'approved' WHERE student_roll_number = $1 and department_name = $2 RETURNING *";
    const updateResult = await pool.query(updateQuery, [
      applicationData,
      department_name,
    ]);

    if (updateResult.rows.length > 0) {
      const deletedRequest = updateResult.rows[0];
      const deleteQuery = "DELETE FROM request_approval WHERE id =$1 ";
      await pool.query(deleteQuery, [id]);

      res.json({
        success: true,
        message: "Request approved and deleted successfully.",
        deletedRequest,
      });
    } else {
      res.json({ success: false, message: "Request not found" });
    }
  } catch (error) {
    console.error("Error approving request:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const approveDeny = async (req, res) => {
  try {
    const { id, applicationData, department_name } = req.body;
    const updateQuery =
      "UPDATE department_details SET status = 'pending' WHERE student_roll_number = $1 and department_name = $2 RETURNING *";
    const updateResult = await pool.query(updateQuery, [
      applicationData,
      department_name,
    ]);

    if (updateResult.rows.length > 0) {
      const deletedRequest = updateResult.rows[0];
      const deleteQuery = "DELETE FROM request_approval WHERE id =$1 ";
      await pool.query(deleteQuery, [id]);

      res.json({
        success: true,
        message: "Request status updated successfully.",
        deletedRequest,
      });
    } else {
      res.json({ success: false, message: "Request not found" });
    }
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const denyRequest = async (req, res) => {
  try {
    const requestId = req.params.id;

    // Delete the request from the application table
    const deleteRequestQuery = "DELETE FROM application WHERE id = $1";
    await pool.query(deleteRequestQuery, [requestId]);

    return res.status(200).json({
      success: true,
      message: "Request denied and deleted successfully.",
    });
  } catch (error) {
    console.error("Error denying and deleting request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  getApplicationData,
  getPendingRequests,
  approveRequest,
  approveDeny,
  denyRequest,
  insertStudentDetails,
  login,
  register,
  requestApproval,
  chk,
};
