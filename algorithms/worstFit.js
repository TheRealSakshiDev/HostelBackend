function worstFit(rooms, groups) {

    // Make a copy of rooms
    // Convert capacity values to Number
    const availableRooms = rooms.map(room => ({
        ...room,
        available_capacity: Number(room.available_capacity)
    }));

    const allocations = [];

    // Process each student group
    for (const group of groups) {

        const requiredCapacity =
            Number(group.required_capacity);

        let worstRoom = null;

        // Check every room
        for (const room of availableRooms) {

            // Room must have enough capacity
            if (
                room.available_capacity >=
                requiredCapacity
            ) {

                // Select the largest suitable room
                if (
                    worstRoom === null ||
                    room.available_capacity >
                    worstRoom.available_capacity
                ) {
                    worstRoom = room;
                }
            }
        }

        // Suitable room found
        if (worstRoom !== null) {

            const remainingCapacity =
                worstRoom.available_capacity -
                requiredCapacity;

            allocations.push({

                group_id:
                group.group_id,

                group_name:
                group.group_name,

                required_capacity:
                requiredCapacity,

                room_id:
                worstRoom.room_id,

                room_number:
                worstRoom.room_number,

                allocated_capacity:
                requiredCapacity,

                remaining_capacity:
                remainingCapacity,

                status: "Allocated"
            });

            // Update temporary room capacity
            worstRoom.available_capacity =
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


module.exports = worstFit;