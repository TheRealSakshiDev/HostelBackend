function firstFit(rooms, groups) {

    // Copy rooms so original database data is not modified
    const availableRooms = rooms.map(room => ({
        ...room,
        available_capacity: Number(room.available_capacity)
    }));

    const allocations = [];

    // Process groups one by one
    for (const group of groups) {

        const requiredCapacity =
            Number(group.required_capacity);

        let allocated = false;

        // Check rooms from first to last
        for (const room of availableRooms) {

            // First suitable room
            if (
                room.available_capacity >=
                requiredCapacity
            ) {

                const remainingCapacity =
                    room.available_capacity -
                    requiredCapacity;

                allocations.push({

                    group_id: group.group_id,

                    group_name: group.group_name,

                    required_capacity:
                    requiredCapacity,

                    room_id: room.room_id,

                    room_number:
                    room.room_number,

                    allocated_capacity:
                    requiredCapacity,

                    remaining_capacity:
                    remainingCapacity,

                    status: "Allocated"
                });

                // Update temporary room capacity
                room.available_capacity =
                    remainingCapacity;

                allocated = true;

                // First Fit → stop searching
                break;
            }
        }


        // No suitable room
        if (!allocated) {

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


module.exports = firstFit;