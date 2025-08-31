//TODO: Create a script to create categories

import { db } from "@/db";
import { categories } from "@/db/schema";

const categoriesName =[
    "Cars and vehicles",
    "Comedy",
    "Education",
    "Gaming",
    "Entertainment",
    "Film and animation",
    "How to and style",
    "Music",
    "News and polotics",
    "People and vlogs",
    "Pets and animals",
    "Science and technolody",
    "Sports",
    "Travel and events",
];

async function main() {
    console.log("Seeding categories...");
    try {
        const values = categoriesName.map((name)=>({
            name,
            description: `Videos related to ${name.toLowerCase()}`,
        }));

        await db.insert(categories).values(values);
        console.log("Categories seeded successfully!");
    } catch (error) {
        console.log("Error seeding categories: ",error);
        process.exit(1);
    }
}
main();