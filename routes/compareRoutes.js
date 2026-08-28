const express = require("express");
const router = express.Router();

const db = require("../config/database");

const firstFit = require("../algorithms/firstFit");
const bestFit = require("../algorithms/bestFit");
const worstFit = require("../algorithms/worstFit");


// GET /api/compare
router.get("/", (req, res) => {

    const roomSql = "SELECT * FROM rooms";
    const groupSql = "SELECT * FROM student_groups";


    // Get rooms
    db.query(roomSql, (roomError, rooms) => {

        if (roomError) {
            console.error(roomError);

            return res.status(500).json({
                message: "Failed to fetch rooms"
            });
        }


        // Get student groups
        db.query(groupSql, (groupError, groups) => {

            if (groupError) {
                console.error(groupError);

                return res.status(500).json({
                    message: "Failed to fetch student groups"
                });
            }


            // Run all three algorithms
            const firstFitResult = firstFit(rooms, groups);

            const bestFitResult = bestFit(rooms, groups);

            const worstFitResult = worstFit(rooms, groups);


            // Count allocated groups
            const firstFitAllocated =
                firstFitResult.filter(
                    item => item.room_id !== null
                ).length;

            const bestFitAllocated =
                bestFitResult.filter(
                    item => item.room_id !== null
                ).length;

            const worstFitAllocated =
                worstFitResult.filter(
                    item => item.room_id !== null
                ).length;


            // Count unallocated groups
            const firstFitNotAllocated =
                firstFitResult.filter(
                    item => item.room_id === null
                ).length;

            const bestFitNotAllocated =
                bestFitResult.filter(
                    item => item.room_id === null
                ).length;

            const worstFitNotAllocated =
                worstFitResult.filter(
                    item => item.room_id === null
                ).length;


            // Send comparison
            res.status(200).json({

                totalRooms: rooms.length,

                totalGroups: groups.length,

                comparison: {

                    firstFit: {
                        allocated: firstFitAllocated,
                        notAllocated: firstFitNotAllocated,
                        allocations: firstFitResult
                    },

                    bestFit: {
                        allocated: bestFitAllocated,
                        notAllocated: bestFitNotAllocated,
                        allocations: bestFitResult
                    },

                    worstFit: {
                        allocated: worstFitAllocated,
                        notAllocated: worstFitNotAllocated,
                        allocations: worstFitResult
                    }
                }

            });

        });

    });

});


module.exports = router;