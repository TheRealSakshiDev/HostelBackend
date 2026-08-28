function bestFit(rooms, groups) {

    // Make a copy of rooms
    const availableRooms = rooms.map(room => ({
        ...room
    }));

    const allocations = [];

    // Process each student group
    for (const group of groups) {

        let bestRoom = null;

        // Check every room
        for (const room of availableRooms) {

            if (room.available_capacity >= group.required_capacity) {

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

        // If suitable room is found
        if (bestRoom !== null) {

            const remainingCapacity =
                bestRoom.available_capacity -
                group.required_capacity;

            allocations.push({
                group_id: group.group_id,
                group_name: group.group_name,
                required_capacity: group.required_capacity,
                room_id: bestRoom.room_id,
                room_number: bestRoom.room_number,
                allocated_capacity: group.required_capacity,
                remaining_capacity: remainingCapacity
            });

            // Update remaining room capacity
            bestRoom.available_capacity = remainingCapacity;

        } else {

            // No suitable room
            allocations.push({
                group_id: group.group_id,
                group_name: group.group_name,
                required_capacity: group.required_capacity,
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