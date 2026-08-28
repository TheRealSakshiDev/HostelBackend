const bestFit = require("./algorithms/bestFit");


// Sample rooms
const rooms = [
    {
        room_id: 1,
        room_number: "R101",
        available_capacity: 100
    },
    {
        room_id: 2,
        room_number: "R102",
        available_capacity: 500
    },
    {
        room_id: 3,
        room_number: "R103",
        available_capacity: 200
    },
    {
        room_id: 4,
        room_number: "R104",
        available_capacity: 300
    },
    {
        room_id: 5,
        room_number: "R105",
        available_capacity: 600
    }
];


// Sample student groups
const groups = [
    {
        group_id: 1,
        group_name: "Group 1",
        required_capacity: 212
    },
    {
        group_id: 2,
        group_name: "Group 2",
        required_capacity: 417
    },
    {
        group_id: 3,
        group_name: "Group 3",
        required_capacity: 112
    },
    {
        group_id: 4,
        group_name: "Group 4",
        required_capacity: 426
    }
];


// Run Best Fit
const result = bestFit(rooms, groups);


// Display result
console.log("========== BEST FIT RESULT ==========");

console.table(result);