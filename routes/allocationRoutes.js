const express = require("express");
const router = express.Router();

const db = require("../config/database");

const firstFit = require("../algorithms/firstFit");
const bestFit = require("../algorithms/bestFit");
const worstFit = require("../algorithms/worstFit");


// ==========================================================
// POST /api/allocate
// Run allocation algorithm and save results
// ==========================================================

router.post("/", (req, res) => {

    const { algorithm } = req.body;

    if (!algorithm) {

        return res.status(400).json({
            message: "Algorithm is required"
        });
    }


    if (
        algorithm !== "firstFit" &&
        algorithm !== "bestFit" &&
        algorithm !== "worstFit"
    ) {

        return res.status(400).json({

            message: "Invalid algorithm",

            availableAlgorithms: [
                "firstFit",
                "bestFit",
                "worstFit"
            ]

        });
    }


    // ======================================================
    // GET ROOMS
    // ======================================================

    const sqlRooms = `
        SELECT *
        FROM rooms
        ORDER BY room_id
    `;


    // ======================================================
    // GET GROUPS
    // ======================================================

    const sqlGroups = `
        SELECT *
        FROM student_groups
        ORDER BY group_id
    `;


    db.query(sqlRooms, (roomError, rooms) => {

        if (roomError) {

            console.error(
                "Room Error:",
                roomError
            );

            return res.status(500).json({

                message: "Failed to fetch rooms",

                error: roomError.message

            });
        }


        db.query(sqlGroups, (groupError, groups) => {

            if (groupError) {

                console.error(
                    "Group Error:",
                    groupError
                );

                return res.status(500).json({

                    message: "Failed to fetch student groups",

                    error: groupError.message

                });
            }


            // ==================================================
            // CHECK DATA
            // ==================================================

            if (!rooms || rooms.length === 0) {

                return res.status(200).json({

                    algorithm: algorithm,

                    message: "No rooms available",

                    allocations: []

                });
            }


            if (!groups || groups.length === 0) {

                return res.status(200).json({

                    algorithm: algorithm,

                    message: "No student groups available",

                    allocations: []

                });
            }


            // ==================================================
            // RUN ALGORITHM
            // ==================================================

            let result;


            try {

                if (algorithm === "firstFit") {

                    result =
                        firstFit(
                            rooms,
                            groups
                        );

                }
                else if (algorithm === "bestFit") {

                    result =
                        bestFit(
                            rooms,
                            groups
                        );

                }
                else {

                    result =
                        worstFit(
                            rooms,
                            groups
                        );
                }


            }
            catch (error) {

                console.error(
                    "Algorithm Error:",
                    error
                );

                return res.status(500).json({

                    message:
                        "Allocation algorithm failed",

                    error:
                    error.message

                });
            }


            // ==================================================
            // NO RESULT
            // ==================================================

            if (
                !result ||
                result.length === 0
            ) {

                return res.status(200).json({

                    algorithm: algorithm,

                    message:
                        "No allocation could be generated",

                    allocations: []

                });
            }


            // ==================================================
            // INSERT ALLOCATIONS
            // ==================================================

            const insertSql = `
                INSERT INTO allocations
                (
                    group_id,
                    room_id,
                    algorithm,
                    allocated_capacity,
                    remaining_capacity,
                    required_capacity,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;


            let completed = 0;

            let responseSent = false;


            // ==================================================
            // PROCESS EACH ALLOCATION
            // ==================================================

            result.forEach(allocation => {

                const roomId =
                    allocation.room_id;


                const status =
                    roomId === null ||
                    roomId === undefined
                        ? "Not Allocated"
                        : "Allocated";


                const values = [

                    allocation.group_id,

                    roomId,

                    algorithm,

                    allocation.allocated_capacity || 0,

                    allocation.remaining_capacity || 0,

                    allocation.required_capacity || 0,

                    status

                ];


                // ==================================================
                // SAVE ALLOCATION
                // ==================================================

                db.query(
                    insertSql,
                    values,
                    (insertError) => {

                        if (responseSent) {
                            return;
                        }


                        if (insertError) {

                            console.error(
                                "Insert Error:",
                                insertError
                            );

                            responseSent = true;


                            return res.status(500).json({

                                message:
                                    "Failed to save allocation",

                                error:
                                insertError.message,

                                code:
                                insertError.code,

                                sqlMessage:
                                insertError.sqlMessage

                            });
                        }


                        // ==================================================
                        // UPDATE ROOM CAPACITY
                        // ==================================================

                        if (
                            roomId !== null &&
                            roomId !== undefined
                        ) {

                            const allocatedCapacity =
                                Number(
                                    allocation.allocated_capacity || 0
                                );


                            if (
                                allocatedCapacity > 0
                            ) {

                                const updateRoomSql = `

                                    UPDATE rooms

                                    SET available_capacity =
                                        GREATEST(
                                            available_capacity - ?,
                                            0
                                        ),

                                        status =
                                        CASE

                                            WHEN
                                                GREATEST(
                                                    available_capacity - ?,
                                                    0
                                                ) = 0

                                            THEN 'Full'

                                            ELSE 'Available'

                                        END

                                    WHERE room_id = ?

                                `;


                                db.query(

                                    updateRoomSql,

                                    [
                                        allocatedCapacity,
                                        allocatedCapacity,
                                        roomId
                                    ],

                                    (updateError) => {

                                        if (
                                            responseSent
                                        ) {
                                            return;
                                        }


                                        if (
                                            updateError
                                        ) {

                                            console.error(
                                                "Room Update Error:",
                                                updateError
                                            );


                                            responseSent =
                                                true;


                                            return res.status(500).json({

                                                message:
                                                    "Allocation saved but room capacity update failed",

                                                error:
                                                updateError.message

                                            });
                                        }


                                        completed++;


                                        sendFinalResponse();

                                    }
                                );

                            }
                            else {

                                completed++;

                                sendFinalResponse();

                            }

                        }
                        else {

                            completed++;

                            sendFinalResponse();

                        }


                        // ==================================================
                        // FINAL RESPONSE
                        // ==================================================

                        function sendFinalResponse() {

                            if (
                                completed ===
                                result.length
                            ) {

                                if (
                                    responseSent
                                ) {
                                    return;
                                }


                                responseSent =
                                    true;


                                return res.status(200).json({

                                    algorithm:
                                    algorithm,

                                    message:
                                        "Allocation completed and room capacity updated successfully",

                                    allocations:
                                    result

                                });
                            }
                        }

                    }
                );

            });

        });

    });

});


// ==========================================================
// GET ALL ALLOCATIONS
// GET /api/allocate
// ==========================================================

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


    db.query(
        sql,
        (error, results) => {

            if (error) {

                console.error(
                    "Allocation Fetch Error:",
                    error
                );


                return res.status(500).json({

                    message:
                        "Failed to fetch allocations",

                    error:
                    error.message

                });
            }


            return res.status(200).json({

                message:
                    "Allocations fetched successfully",

                allocations:
                results

            });

        }
    );

});


// ==========================================================
// DELETE ALL ALLOCATIONS
// DELETE /api/allocate
// ==========================================================

router.delete("/", (req, res) => {

    const sql =
        "DELETE FROM allocations";


    db.query(
        sql,
        (err, result) => {

            if (err) {

                console.error(err);


                return res.status(500).json({

                    message:
                        "Failed to clear allocations",

                    error:
                    err.message

                });
            }


            res.status(200).json({

                message:
                    "All allocation results cleared successfully",

                deletedRecords:
                result.affectedRows

            });

        }
    );

});


module.exports = router;