function firstFit(rooms, groups) {

    // Make a copy so original room data is not changed
    const availableRooms = rooms.map(room => ({
        ...room
    }));

    const allocations = [];

    // Process each student group
    for (const group of groups) {

        let allocated = false;

        // Check rooms from the beginning
        for (const room of availableRooms) {

            // First room that can accommodate the group
            if (room.available_capacity >= group.required_capacity) {

                const remainingCapacity =
                    room.available_capacity - group.required_capacity;

                allocations.push({
                    group_id: group.group_id,
                    group_name: group.group_name,
                    required_capacity: group.required_capacity,
                    room_id: room.room_id,
                    room_number: room.room_number,
                    allocated_capacity: group.required_capacity,
                    remaining_capacity: remainingCapacity
                });

                // Update room's remaining capacity
                room.available_capacity = remainingCapacity;

                allocated = true;

                // Stop checking rooms for this group
                break;
            }
        }

        // If no room can accommodate the group
        if (!allocated) {

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

module.exports = firstFit;