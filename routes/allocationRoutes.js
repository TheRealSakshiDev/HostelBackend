const express = require("express");
const router = express.Router();

const db = require("../config/database");

const firstFit = require("../algorithms/firstFit");
const bestFit = require("../algorithms/bestFit");
const worstFit = require("../algorithms/worstFit");


// ==========================================================
// POST /api/allocate
// Run First Fit / Best Fit / Worst Fit
// ==========================================================

router.post("/", (req, res) => {

    const { algorithm } = req.body;

    // ------------------------------------------------------
    // Validate algorithm
    // ------------------------------------------------------

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


    // ------------------------------------------------------
    // Get rooms
    // ------------------------------------------------------

    const sqlRooms = `
        SELECT *
        FROM rooms
        ORDER BY room_id ASC
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


        // --------------------------------------------------
        // Get student groups
        // --------------------------------------------------

        const sqlGroups = `
            SELECT *
            FROM student_groups
            ORDER BY group_id ASC
        `;


        db.query(
            sqlGroups,
            (groupError, groups) => {

                if (groupError) {

                    console.error(
                        "Group Error:",
                        groupError
                    );

                    return res.status(500).json({
                        message:
                            "Failed to fetch student groups",
                        error:
                        groupError.message
                    });
                }


                // ------------------------------------------------
                // Check data
                // ------------------------------------------------

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
                        message:
                            "No student groups available",
                        allocations: []
                    });
                }


                // ------------------------------------------------
                // Run selected algorithm
                // ------------------------------------------------

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
                    else if (algorithm === "worstFit") {

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


                // ------------------------------------------------
                // Check algorithm result
                // ------------------------------------------------

                if (
                    !result ||
                    result.length === 0
                ) {

                    return res.status(200).json({
                        algorithm: algorithm,
                        message:
                            "No allocation result",
                        allocations: []
                    });
                }


                // =================================================
                // IMPORTANT
                // Save allocation + update room capacity
                // using transaction
                // =================================================

                db.beginTransaction(
                    transactionError => {

                        if (transactionError) {

                            console.error(
                                "Transaction Error:",
                                transactionError
                            );

                            return res.status(500).json({
                                message:
                                    "Failed to start allocation transaction",
                                error:
                                transactionError.message
                            });
                        }


                        // ------------------------------------------------
                        // Clear previous results
                        // ------------------------------------------------

                        const deleteSql =
                            "DELETE FROM allocations";


                        db.query(
                            deleteSql,
                            deleteError => {

                                if (deleteError) {

                                    return db.rollback(
                                        () => {

                                            console.error(
                                                "Delete Error:",
                                                deleteError
                                            );

                                            res.status(500).json({
                                                message:
                                                    "Failed to clear previous allocations",
                                                error:
                                                deleteError.message
                                            });
                                        }
                                    );
                                }


                                // ------------------------------------------------
                                // Reset room available capacity
                                // ------------------------------------------------

                                const resetRoomsSql = `
                                    UPDATE rooms
                                    SET available_capacity = capacity,
                                        status = 'Available'
                                `;


                                db.query(
                                    resetRoomsSql,
                                    resetError => {

                                        if (resetError) {

                                            return db.rollback(
                                                () => {

                                                    console.error(
                                                        "Reset Room Error:",
                                                        resetError
                                                    );

                                                    res.status(500).json({
                                                        message:
                                                            "Failed to reset room capacity",
                                                        error:
                                                        resetError.message
                                                    });
                                                }
                                            );
                                        }


                                        // ------------------------------------------------
                                        // Save each allocation
                                        // ------------------------------------------------

                                        saveAllocations(
                                            0,
                                            result,
                                            algorithm,
                                            db,
                                            error => {

                                                if (error) {

                                                    return db.rollback(
                                                        () => {

                                                            console.error(
                                                                "Save Allocation Error:",
                                                                error
                                                            );

                                                            res.status(500).json({
                                                                message:
                                                                    "Failed to save allocation",
                                                                error:
                                                                error.message
                                                            });
                                                        }
                                                    );
                                                }


                                                // ------------------------------------------------
                                                // Commit transaction
                                                // ------------------------------------------------

                                                db.commit(
                                                    commitError => {

                                                        if (commitError) {

                                                            return db.rollback(
                                                                () => {

                                                                    console.error(
                                                                        "Commit Error:",
                                                                        commitError
                                                                    );

                                                                    res.status(500).json({
                                                                        message:
                                                                            "Failed to complete allocation",
                                                                        error:
                                                                        commitError.message
                                                                    });
                                                                }
                                                            );
                                                        }


                                                        // ------------------------------------------------
                                                        // SUCCESS
                                                        // ------------------------------------------------

                                                        return res.status(200).json({

                                                            algorithm:
                                                            algorithm,

                                                            message:
                                                                "Allocation completed and saved successfully",

                                                            allocations:
                                                            result

                                                        });

                                                    }
                                                );

                                            }
                                        );

                                    }
                                );

                            }
                        );

                    }
                );

            }
        );

    });

});


// ==========================================================
// SAVE ALLOCATIONS
// ==========================================================

function saveAllocations(
    index,
    allocations,
    algorithm,
    db,
    callback
) {

    // All allocations saved
    if (
        index >=
        allocations.length
    ) {

        return callback(null);
    }


    const allocation =
        allocations[index];


    const status =
        allocation.room_id === null
            ? "Not Allocated"
            : "Allocated";


    // --------------------------------------------------------
    // Insert allocation
    // --------------------------------------------------------

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


    const values = [

        allocation.group_id,

        allocation.room_id,

        algorithm,

        allocation.required_capacity,

        allocation.allocated_capacity,

        allocation.remaining_capacity,

        status

    ];


    db.query(
        insertSql,
        values,
        (insertError, result) => {

            if (insertError) {

                return callback(
                    insertError
                );
            }


            // ------------------------------------------------
            // If room allocated
            // update actual room capacity
            // ------------------------------------------------

            if (
                allocation.room_id !== null
            ) {

                const updateRoomSql = `
                    UPDATE rooms
                    SET available_capacity = ?,
                        status = ?
                    WHERE room_id = ?
                `;


                const roomStatus =
                    Number(
                        allocation.remaining_capacity
                    ) > 0
                        ? "Available"
                        : "Full";


                const roomValues = [

                    allocation.remaining_capacity,

                    roomStatus,

                    allocation.room_id

                ];


                db.query(
                    updateRoomSql,
                    roomValues,
                    updateError => {

                        if (updateError) {

                            return callback(
                                updateError
                            );
                        }


                        // Save next allocation
                        saveAllocations(
                            index + 1,
                            allocations,
                            algorithm,
                            db,
                            callback
                        );

                    }
                );

            }
            else {

                // No room allocated
                saveAllocations(
                    index + 1,
                    allocations,
                    algorithm,
                    db,
                    callback
                );

            }

        }
    );
}


// ==========================================================
// GET /api/allocate
// Get allocation history/results
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
        ORDER BY a.allocation_id ASC
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
// DELETE /api/allocate
// Clear allocation results
// ==========================================================

router.delete("/", (req, res) => {

    const sql =
        "DELETE FROM allocations";


    db.query(
        sql,
        (err, result) => {

            if (err) {

                console.error(
                    "Clear Allocation Error:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Failed to clear allocations",
                    error:
                    err.message
                });
            }


            // Reset rooms after clearing allocations
            const resetSql = `
                UPDATE rooms
                SET available_capacity = capacity,
                    status = 'Available'
            `;


            db.query(
                resetSql,
                resetError => {

                    if (resetError) {

                        console.error(
                            "Room Reset Error:",
                            resetError
                        );

                        return res.status(500).json({
                            message:
                                "Allocations cleared but room reset failed",
                            error:
                            resetError.message
                        });
                    }


                    return res.status(200).json({

                        message:
                            "All allocation results cleared successfully",

                        deletedRecords:
                        result.affectedRows

                    });

                }
            );

        }
    );

});


module.exports = router;