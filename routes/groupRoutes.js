const express = require("express");
const router = express.Router();

const db = require("../config/database");


// ==========================================
// GET ALL STUDENT GROUPS
// GET /api/groups
// ==========================================
router.get("/", (req, res) => {

    const sql = "SELECT * FROM student_groups";

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to fetch student groups"
            });
        }

        res.status(200).json(results);
    });
});


// ==========================================
// ADD STUDENT GROUP
// POST /api/groups
// ==========================================
router.post("/", (req, res) => {

    const {
        group_name,
        required_capacity
    } = req.body;

    if (!group_name || !required_capacity) {
        return res.status(400).json({
            message: "Group name and required capacity are required"
        });
    }

    const sql = `
        INSERT INTO student_groups
        (group_name, required_capacity)
        VALUES (?, ?)
    `;

    const values = [
        group_name,
        required_capacity
    ];

    db.query(sql, values, (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to add student group"
            });
        }

        res.status(201).json({
            message: "Student group added successfully",
            group_id: result.insertId
        });
    });
});


// ==========================================
// UPDATE STUDENT GROUP
// PUT /api/groups/:id
// ==========================================
router.put("/:id", (req, res) => {

    const groupId = req.params.id;

    const {
        group_name,
        required_capacity
    } = req.body;

    if (!group_name || !required_capacity) {
        return res.status(400).json({
            message: "Group name and required capacity are required"
        });
    }

    const sql = `
        UPDATE student_groups
        SET group_name = ?,
            required_capacity = ?
        WHERE group_id = ?
    `;

    const values = [
        group_name,
        required_capacity,
        groupId
    ];

    db.query(sql, values, (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to update student group"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Student group not found"
            });
        }

        res.status(200).json({
            message: "Student group updated successfully"
        });
    });
});


// ==========================================
// DELETE STUDENT GROUP
// DELETE /api/groups/:id
// ==========================================
router.delete("/:id", (req, res) => {

    const groupId = req.params.id;

    const sql = `
        DELETE FROM student_groups
        WHERE group_id = ?
    `;

    db.query(sql, [groupId], (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to delete student group"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Student group not found"
            });
        }

        res.status(200).json({
            message: "Student group deleted successfully"
        });
    });
});


module.exports = router;