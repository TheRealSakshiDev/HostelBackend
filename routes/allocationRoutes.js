const express = require("express");
const router = express.Router();

const db = require("../config/database");

const firstFit = require("../algorithms/firstFit");
const bestFit = require("../algorithms/bestFit");
const worstFit = require("../algorithms/worstFit");

// POST /api/allocate
router.post("/", (req, res) => {

    const { algorithm } = req.body;

    if (!algorithm) {
        return res.status(400).json({
            message: "Algorithm is required"
        });
    }

    const sqlRooms = "SELECT * FROM rooms";
    const sqlGroups = "SELECT * FROM student_groups";

    // Get rooms
    db.query(sqlRooms, (roomError, rooms) => {

        if (roomError) {
            console.error("Room Error:", roomError);

            return res.status(500).json({
                message: "Failed to fetch rooms"
            });
        }

        // Get student groups
        db.query(sqlGroups, (groupError, groups) => {

            if (groupError) {
                console.error("Group Error:", groupError);

                return res.status(500).json({
                    message: "Failed to fetch student groups"
                });
            }

            let result;

            // Select algorithm
            try {

                if (algorithm === "firstFit") {

                    result = firstFit(rooms, groups);

                } else if (algorithm === "bestFit") {

                    result = bestFit(rooms, groups);

                } else if (algorithm === "worstFit") {

                    result = worstFit(rooms, groups);

                } else {

                    return res.status(400).json({
                        message: "Invalid algorithm",
                        availableAlgorithms: [
                            "firstFit",
                            "bestFit",
                            "worstFit"
                        ]
                    });
                }

            } catch (error) {

                console.error("Algorithm Error:", error);

                return res.status(500).json({
                    message: "Allocation algorithm failed",
                    error: error.message
                });
            }

            // No allocation result
            if (!result || result.length === 0) {

                return res.status(200).json({
                    algorithm: algorithm,
                    message: "No student groups available",
                    allocations: []
                });
            }

            // SQL for saving allocation
            const insertSql = `
                INSERT INTO allocations
                (
                    group_id,
                    room_id,
                    algorithm,
                    required_capacity,
                    allocated_capacity,
                    remaining_capacity,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            let completed = 0;
            let responseSent = false;

            result.forEach(allocation => {

                const status =
                    allocation.room_id === null
                        ? "Not Allocated"
                        : "Allocated";

                const values = [
                    allocation.group_id,
                    allocation.room_id,
                    algorithm,
                    allocation.required_capacity,
                    allocation.allocated_capacity,
                    allocation.remaining_capacity,
                    status
                ];

                db.query(insertSql, values, (insertError) => {

                    // Prevent multiple responses
                    if (responseSent) {
                        return;
                    }

                    if (insertError) {

                        console.error("Insert Error:", insertError);

                        responseSent = true;

                        return res.status(500).json({
                            message: "Failed to save allocation",
                            error: insertError.message,
                            code: insertError.code,
                            sqlMessage: insertError.sqlMessage
                        });
                    }

                    completed++;

                    // All allocations successfully saved
                    if (completed === result.length) {

                        responseSent = true;

                        return res.status(200).json({
                            algorithm: algorithm,
                            message: "Allocation completed and saved successfully",
                            allocations: result
                        });
                    }

                });

            });

        });

    });

});
// GET /api/allocate
router.get("/", (req, res) => {

    const sql = `
        SELECT
            a.allocation_id,
            a.group_id,
            a.room_id,
            a.algorithm,
            a.required_capacity,
            a.allocated_capacity,
            a.remaining_capacity,
            a.status,
            a.allocation_date
        FROM allocations a
        ORDER BY a.allocation_id DESC
    `;

    db.query(sql, (error, results) => {

        if (error) {
            console.error("Allocation Fetch Error:", error);

            return res.status(500).json({
                message: "Failed to fetch allocations",
                error: error.message
            });
        }

        return res.status(200).json({
            message: "Allocations fetched successfully",
            allocations: results
        });
    });

});
// DELETE /api/allocate
// Clear all allocation results

router.delete("/", (req, res) => {

    const sql = "DELETE FROM allocations";

    db.query(sql, (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to clear allocations"
            });
        }

        res.status(200).json({
            message: "All allocation results cleared successfully",
            deletedRecords: result.affectedRows
        });
    });

});

module.exports = router;