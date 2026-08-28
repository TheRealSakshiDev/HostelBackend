const express = require("express");
const router = express.Router();

const db = require("../config/database");


// GET /api/dashboard
router.get("/", (req, res) => {

    const roomSql = `
        SELECT COUNT(*) AS totalRooms
        FROM rooms
    `;

    const groupSql = `
        SELECT COUNT(*) AS totalGroups
        FROM student_groups
    `;

    const allocatedSql = `
        SELECT COUNT(*) AS allocatedGroups
        FROM allocations
        WHERE status = 'Allocated'
    `;

    const notAllocatedSql = `
        SELECT COUNT(*) AS notAllocatedGroups
        FROM allocations
        WHERE status = 'Not Allocated'
    `;

    const capacitySql = `
        SELECT
            COALESCE(SUM(capacity), 0) AS totalCapacity,
            COALESCE(SUM(available_capacity), 0) AS availableCapacity
        FROM rooms
    `;


    db.query(roomSql, (roomError, roomResult) => {

        if (roomError) {
            console.error(roomError);

            return res.status(500).json({
                message: "Failed to get room statistics"
            });
        }


        db.query(groupSql, (groupError, groupResult) => {

            if (groupError) {
                console.error(groupError);

                return res.status(500).json({
                    message: "Failed to get group statistics"
                });
            }


            db.query(allocatedSql, (allocatedError, allocatedResult) => {

                if (allocatedError) {
                    console.error(allocatedError);

                    return res.status(500).json({
                        message: "Failed to get allocation statistics"
                    });
                }


                db.query(
                    notAllocatedSql,
                    (notAllocatedError, notAllocatedResult) => {

                        if (notAllocatedError) {
                            console.error(notAllocatedError);

                            return res.status(500).json({
                                message: "Failed to get unallocated statistics"
                            });
                        }


                        db.query(
                            capacitySql,
                            (capacityError, capacityResult) => {

                                if (capacityError) {
                                    console.error(capacityError);

                                    return res.status(500).json({
                                        message:
                                            "Failed to get capacity statistics"
                                    });
                                }


                                res.status(200).json({

                                    totalRooms:
                                    roomResult[0].totalRooms,

                                    totalGroups:
                                    groupResult[0].totalGroups,

                                    allocatedGroups:
                                    allocatedResult[0].allocatedGroups,

                                    notAllocatedGroups:
                                    notAllocatedResult[0]
                                        .notAllocatedGroups,

                                    totalCapacity:
                                    capacityResult[0].totalCapacity,

                                    availableCapacity:
                                    capacityResult[0].availableCapacity
                                });

                            }
                        );

                    }
                );

            });

        });

    });

});


module.exports = router;