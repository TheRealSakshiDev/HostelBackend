function bestFit(rooms, groups) {

    // Make a copy of rooms
    // Convert available_capacity to Number
    const availableRooms = rooms.map(room => ({
        ...room,
        available_capacity: Number(room.available_capacity)
    }));

    const allocations = [];

    // Process each student group
    for (const group of groups) {

        const requiredCapacity =
            Number(group.required_capacity);

        let bestRoom = null;

        // Check every room
        for (const room of availableRooms) {

            // Room must have enough capacity
            if (
                room.available_capacity >=
                requiredCapacity
            ) {

                // Select the smallest suitable room
                if (
                    bestRoom === null ||
                    room.available_capacity <
                    bestRoom.available_capacity
                ) {
                    bestRoom = room;
                }
            }
        }

        // Suitable room found
        if (bestRoom !== null) {

            const remainingCapacity =
                bestRoom.available_capacity -
                requiredCapacity;

            allocations.push({

                group_id:
                group.group_id,

                group_name:
                group.group_name,

                required_capacity:
                requiredCapacity,

                room_id:
                bestRoom.room_id,

                room_number:
                bestRoom.room_number,

                allocated_capacity:
                requiredCapacity,

                remaining_capacity:
                remainingCapacity,

                status: "Allocated"
            });

            // Update temporary capacity
            bestRoom.available_capacity =
                remainingCapacity;

        } else {

            // No suitable room
            allocations.push({

                group_id:
                group.group_id,

                group_name:
                group.group_name,

                required_capacity:
                requiredCapacity,

                room_id: null,

                room_number: null,

                allocated_capacity: 0,

                remaining_capacity: null,

                status: "Not Allocated"
            });
        }
    }

    return allocations;
}


module.exports = bestFit;