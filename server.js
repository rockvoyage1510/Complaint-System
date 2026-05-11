const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
// ======================
// MYSQL CONNECTION
// ======================


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err);
    } else {
        console.log("MySQL Connected");
    }
});
// ======================
// TRACKING ID
// ======================

function generateTrackingID() {
    return 'TRK' + Math.floor(100000 + Math.random() * 900000);
}

// ======================
// LOGIN
// ======================

app.post('/login', (req, res) => {

    const { username, password, role } = req.body;

    const sql =
        "SELECT * FROM users WHERE username=? AND password=? AND role=?";

    db.query(sql, [username, password, role], (err, result) => {

        if (err) {
            console.log(err);
            return res.json({ success: false });
        }

        if (result.length > 0) {

            res.json({
                success: true,
                user: result[0]
            });

        } else {

            res.json({
                success: false
            });

        }

    });

});

// ======================
// SUBMIT COMPLAINT
// ======================

app.post('/submit', (req, res) => {

    let { main, sub, desc } = req.body;

    if (!main || !sub || !desc) {
        return res.status(400).json({
            error: "All fields required"
        });
    }

    let assignedAdmin = "";

    // ======================
    // ACADEMIC
    // ======================

    if (sub === "Attendance Problem") {
        assignedAdmin = "a1";
    }

    else if (sub === "Faculty Related Problem") {
        assignedAdmin = "a2";
    }

    else if (sub === "Exam Revaluation") {
        assignedAdmin = "a3";
    }

    // ======================
    // NON ACADEMIC
    // ======================

    else if (sub === "Fees Related") {
        assignedAdmin = "na1";
    }

    else if (sub === "College App Issue") {
        assignedAdmin = "na2";
    }

    else if (sub === "Scholarship Related") {
        assignedAdmin = "na3";
    }

    const trackingId = generateTrackingID();

    const sql =
        "INSERT INTO complaints (tracking_id, main, sub, description, assigned_admin) VALUES (?, ?, ?, ?, ?)";

    db.query(
        sql,
        [trackingId, main, sub, desc, assignedAdmin],
        (err) => {

            if (err) {
                console.log(err);
                return res.status(500).json({
                    error: "Database error"
                });
            }

            res.json({
                trackingId
            });

        }
    );

});

// ======================
// LOAD COMPLAINTS
// ======================

app.post('/complaints', (req, res) => {

    let username = req.body.username;

    let sql = "";

    // ======================
    // MASTER ADMINS
    // ======================

    if (username === "admin") {

        sql =
            "SELECT * FROM complaints WHERE main='Academic'";

    }

    else if (username === "admin1") {

        sql =
            "SELECT * FROM complaints WHERE main='Non-Academic'";

    }

    // ======================
    // ACADEMIC ADMINS
    // ======================

    else if (username === "a1") {

        sql =
            "SELECT * FROM complaints WHERE sub='Attendance Problem'";

    }

    else if (username === "a2") {

        sql =
            "SELECT * FROM complaints WHERE sub='Faculty Related Problem'";

    }

    else if (username === "a3") {

        sql =
            "SELECT * FROM complaints WHERE sub='Exam Revaluation'";

    }

    // ======================
    // NON ACADEMIC ADMINS
    // ======================

    else if (username === "na1") {

        sql =
            "SELECT * FROM complaints WHERE sub='Fees Related'";

    }

    else if (username === "na2") {

        sql =
            "SELECT * FROM complaints WHERE sub='College App Issue'";

    }

    else if (username === "na3") {

        sql =
            "SELECT * FROM complaints WHERE sub='Scholarship Related'";

    }

    else {

        return res.json([]);

    }

    db.query(sql, (err, result) => {

        if (err) {
            console.log(err);
            return res.json([]);
        }

        res.json(result);

    });

});

// ======================
// TRACK COMPLAINT
// ======================

app.get('/track/:id', (req, res) => {

    const sql =
        "SELECT * FROM complaints WHERE tracking_id=?";

    db.query(sql, [req.params.id], (err, result) => {

        if (err) {
            console.log(err);
            return res.json({
                message: "Error"
            });
        }

        if (result.length > 0) {

            res.json(result[0]);

        } else {

            res.json({
                message: "Invalid ID"
            });

        }

    });

});

// ======================
// UPDATE STATUS
// ======================

app.post('/update-status', (req, res) => {

    const { tracking_id, status } = req.body;

    const sql =
        "UPDATE complaints SET status=? WHERE tracking_id=?";

    db.query(sql, [status, tracking_id], (err) => {

        if (err) {
            console.log(err);

            return res.json({
                success: false
            });
        }

        res.json({
            success: true
        });

    });

});

// ======================
// START SERVER
// ======================

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on ${PORT}`);
});
