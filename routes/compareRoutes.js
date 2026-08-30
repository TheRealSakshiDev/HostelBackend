const express = require("express");
const router = express.Router();

const db = require("../config/database");

const firstFit = require("../algorithms/firstFit");
const bestFit = require("../algorithms/bestFit");
const worstFit = require("../algorithms/worstFit");


// =====================================================
// GET /api/compare
// =====================================================

router.get("/", (req, res) => {

    const roomSql = "SELECT * FROM rooms";
    const groupSql = "SELECT * FROM student_groups";


    // =================================================
    // GET ROOMS
    // =================================================

    db.query(roomSql, (roomError, rooms) => {

        if (roomError) {

            console.error("Room Error:", roomError);

            return res.status(500).json({
                message: "Failed to fetch rooms",
                error: roomError.message
            });
        }


        // =================================================
        // GET GROUPS
        // =================================================

        db.query(groupSql, (groupError, groups) => {

            if (groupError) {

                console.error("Group Error:", groupError);

                return res.status(500).json({
                    message: "Failed to fetch student groups",
                    error: groupError.message
                });
            }


            // =================================================
            // NO ROOMS
            // =================================================

            if (!rooms || rooms.length === 0) {

                return res.status(200).json({

                    message: "No rooms available",

                    totalRooms: 0,

                    totalGroups: groups.length,

                    comparison: {

                        firstFit: createEmptyResult(),

                        bestFit: createEmptyResult(),

                        worstFit: createEmptyResult()
                    }
                });
            }


            // =================================================
            // NO GROUPS
            // =================================================

            if (!groups || groups.length === 0) {

                return res.status(200).json({

                    message: "No student groups available",

                    totalRooms: rooms.length,

                    totalGroups: 0,

                    comparison: {

                        firstFit: createEmptyResult(),

                        bestFit: createEmptyResult(),

                        worstFit: createEmptyResult()
                    }
                });
            }


            // =================================================
            // FIRST FIT
            // =================================================

            let firstFitResult;

            try {

                firstFitResult =
                    firstFit(rooms, groups);

            } catch (error) {

                console.error(
                    "First Fit Error:",
                    error
                );

                return res.status(500).json({

                    message:
                        "First Fit algorithm failed",

                    error:
                    error.message
                });
            }


            // =================================================
            // BEST FIT
            // =================================================

            let bestFitResult;

            try {

                bestFitResult =
                    bestFit(rooms, groups);

            } catch (error) {

                console.error(
                    "Best Fit Error:",
                    error
                );

                return res.status(500).json({

                    message:
                        "Best Fit algorithm failed",

                    error:
                    error.message
                });
            }


            // =================================================
            // WORST FIT
            // =================================================

            let worstFitResult;

            try {

                worstFitResult =
                    worstFit(rooms, groups);

            } catch (error) {

                console.error(
                    "Worst Fit Error:",
                    error
                );

                return res.status(500).json({

                    message:
                        "Worst Fit algorithm failed",

                    error:
                    error.message
                });
            }


            // =================================================
            // SUMMARY
            // =================================================

            const firstSummary =
                calculateSummary(
                    firstFitResult,
                    rooms
                );


            const bestSummary =
                calculateSummary(
                    bestFitResult,
                    rooms
                );


            const worstSummary =
                calculateSummary(
                    worstFitResult,
                    rooms
                );


            // =================================================
            // RECOMMENDATION
            // =================================================

            const recommendation =
                findRecommendation(
                    firstSummary,
                    bestSummary,
                    worstSummary
                );


            // =================================================
            // RESPONSE
            // =================================================

            return res.status(200).json({

                message:
                    "Algorithm comparison completed successfully",

                totalRooms:
                rooms.length,

                totalGroups:
                groups.length,

                recommendation:
                recommendation,

                comparison: {

                    firstFit: {

                        allocated:
                        firstSummary.allocated,

                        notAllocated:
                        firstSummary.notAllocated,

                        totalRequiredCapacity:
                        firstSummary.totalRequiredCapacity,

                        totalAllocatedCapacity:
                        firstSummary.totalAllocatedCapacity,

                        totalRemainingCapacity:
                        firstSummary.totalRemainingCapacity,

                        allocations:
                        firstFitResult
                    },


                    bestFit: {

                        allocated:
                        bestSummary.allocated,

                        notAllocated:
                        bestSummary.notAllocated,

                        totalRequiredCapacity:
                        bestSummary.totalRequiredCapacity,

                        totalAllocatedCapacity:
                        bestSummary.totalAllocatedCapacity,

                        totalRemainingCapacity:
                        bestSummary.totalRemainingCapacity,

                        allocations:
                        bestFitResult
                    },


                    worstFit: {

                        allocated:
                        worstSummary.allocated,

                        notAllocated:
                        worstSummary.notAllocated,

                        totalRequiredCapacity:
                        worstSummary.totalRequiredCapacity,

                        totalAllocatedCapacity:
                        worstSummary.totalAllocatedCapacity,

                        totalRemainingCapacity:
                        worstSummary.totalRemainingCapacity,

                        allocations:
                        worstFitResult
                    }
                }
            });

        });

    });

});


// =====================================================
// CALCULATE SUMMARY
// =====================================================

function calculateSummary(results, rooms) {

    let allocated = 0;

    let notAllocated = 0;

    let totalRequiredCapacity = 0;

    let totalAllocatedCapacity = 0;


    for (const allocation of results) {

        totalRequiredCapacity +=
            Number(
                allocation.required_capacity || 0
            );


        if (allocation.room_id !== null) {

            allocated++;

            totalAllocatedCapacity +=
                Number(
                    allocation.allocated_capacity || 0
                );

        } else {

            notAllocated++;
        }
    }


    let totalRoomCapacity = 0;


    for (const room of rooms) {

        totalRoomCapacity +=
            Number(
                room.capacity || 0
            );
    }


    const totalRemainingCapacity =
        totalRoomCapacity -
        totalAllocatedCapacity;


    return {

        allocated: allocated,

        notAllocated: notAllocated,

        totalRequiredCapacity:
        totalRequiredCapacity,

        totalAllocatedCapacity:
        totalAllocatedCapacity,

        totalRemainingCapacity:
        totalRemainingCapacity
    };
}


// =====================================================
// EMPTY RESULT
// =====================================================

function createEmptyResult() {

    return {

        allocated: 0,

        notAllocated: 0,

        totalRequiredCapacity: 0,

        totalAllocatedCapacity: 0,

        totalRemainingCapacity: 0,

        allocations: []
    };
}


// =====================================================
// RECOMMENDATION
// =====================================================

function findRecommendation(
    first,
    best,
    worst
) {

    const results = [

        {
            name: "First Fit",
            data: first
        },

        {
            name: "Best Fit",
            data: best
        },

        {
            name: "Worst Fit",
            data: worst
        }
    ];


    // Maximum allocated groups

    const maxAllocated =
        Math.max(
            ...results.map(
                item =>
                    item.data.allocated
            )
        );


    const candidates =
        results.filter(
            item =>
                item.data.allocated ===
                maxAllocated
        );


    // Minimum remaining capacity

    candidates.sort(
        (a, b) =>
            a.data.totalRemainingCapacity -
            b.data.totalRemainingCapacity
    );


    const selected =
        candidates[0];


    return {

        algorithm:
        selected.name,

        allocated:
        selected.data.allocated,

        notAllocated:
        selected.data.notAllocated,

        totalRemainingCapacity:
        selected.data.totalRemainingCapacity,

        reason:
            "Highest number of allocated groups with minimum remaining capacity."
    };
}


module.exports = router;