const express = require("express");
const router = express.Router();

const db = require("../config/database");


// ==========================================
// GET ALL ROOMS
// GET /api/rooms
// ==========================================
router.get("/", (req, res) => {

    const sql = "SELECT * FROM rooms";

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch rooms"
            });
        }

        res.status(200).json(results);
    });
});


// ==========================================
// ADD NEW ROOM
// POST /api/rooms
// ==========================================
router.post("/", (req, res) => {

    const {
        room_number,
        capacity
    } = req.body;

    if (!room_number || !capacity) {
        return res.status(400).json({
            message: "Room number and capacity are required"
        });
    }

    const sql = `
        INSERT INTO rooms
        (room_number, capacity, available_capacity, status)
        VALUES (?, ?, ?, ?)
    `;

    const values = [
        room_number,
        capacity,
        capacity,
        "Available"
    ];

    db.query(sql, values, (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to add room"
            });
        }

        res.status(201).json({
            message: "Room added successfully",
            room_id: result.insertId
        });
    });
});


// ==========================================
// UPDATE ROOM
// PUT /api/rooms/:id
// ==========================================
router.put("/:id", (req, res) => {

    const roomId = req.params.id;

    const {
        room_number,
        capacity
    } = req.body;

    if (!room_number || !capacity) {
        return res.status(400).json({
            message: "Room number and capacity are required"
        });
    }

    const sql = `
        UPDATE rooms
        SET room_number = ?,
            capacity = ?,
            available_capacity = ?
        WHERE room_id = ?
    `;

    const values = [
        room_number,
        capacity,
        capacity,
        roomId
    ];

    db.query(sql, values, (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to update room"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        res.status(200).json({
            message: "Room updated successfully"
        });
    });
});


// ==========================================
// DELETE ROOM
// DELETE /api/rooms/:id
// ==========================================
router.delete("/:id", (req, res) => {

    const roomId = req.params.id;

    const sql = "DELETE FROM rooms WHERE room_id = ?";

    db.query(sql, [roomId], (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to delete room"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        res.status(200).json({
            message: "Room deleted successfully"
        });
    });
});


module.exports = router;