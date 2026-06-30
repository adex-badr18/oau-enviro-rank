import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

const facultiesData = [
  {
    name: "Faculty of Administration",
    buildingName: "Administration Block",
    description: "Faculty responsible for training administrative, management, and accounting experts."
  },
  {
    name: "Faculty of Agriculture",
    buildingName: "Agriculture Building",
    description: "Training and research in agricultural sciences, extension services, and crop technology."
  },
  {
    name: "Faculty of Arts",
    buildingName: "Humanities Block III",
    description: "Studies in languages, history, linguistics, and cultural/dramatic arts."
  },
  {
    name: "Faculty of Basic Medical Sciences",
    buildingName: "Health Sciences Building",
    description: "Core foundation of basic sciences for clinical and medical health professions."
  },
  {
    name: "Faculty of Clinical Sciences",
    buildingName: "College of Health Sciences Complex",
    description: "Advanced clinical training, medicine, and hospital practice."
  },
  {
    name: "Faculty of Dentistry",
    buildingName: "Dental Hospital Complex",
    description: "Specialized oral healthcare and dental surgery training."
  },
  {
    name: "Faculty of Education",
    buildingName: "Education Trust Fund Building",
    description: "Professional teacher training, administration, and educational development."
  },
  {
    name: "Faculty of Environmental Design and Management",
    buildingName: "EDM Building",
    description: "Architecture, building technology, quantity surveying, estate management, and urban planning."
  },
  {
    name: "Faculty of Law",
    buildingName: "Law Faculty Building",
    description: "Comprehensive legal education, research, jurisprudence, and public advocacy."
  },
  {
    name: "Faculty of Pharmacy",
    buildingName: "Pharmacy Complex",
    description: "Pharmaceutical sciences, clinical pharmacy, pharmacognosy, and drug discovery."
  },
  {
    name: "Faculty of Science",
    buildingName: "White House Complex",
    description: "Natural and physical sciences departments, including chemistry, physics, and biosciences."
  },
  {
    name: "Faculty of Social Sciences",
    buildingName: "Social Sciences Block",
    description: "Studies in economics, sociology, geography, and political science."
  },
  {
    name: "Faculty of Technology",
    buildingName: "Spider Building",
    description: "Engineering departments including electronic, computer, mechanical, civil, chemical, and food engineering."
  },
  {
    name: "Faculty of Allied Health Sciences",
    buildingName: "Nursing Science Building",
    description: "Nursing, medical rehabilitation, physiotherapy, and allied health disciplines."
  },
  {
    name: "College of Health Sciences",
    buildingName: "College Headquarters",
    description: "Overarching administrative and educational college for clinical, basic medical, and dental faculties."
  },
  {
    name: "Postgraduate College",
    buildingName: "Postgraduate Complex",
    description: "Coordinating body for master's and doctorate programs."
  }
];

async function main() {
  console.log("Seeding started...");

  // Seed Assessment Period
  const activePeriod = await prisma.assessmentPeriod.upsert({
    where: {
      month_year: {
        month: 6,
        year: 2026
      }
    },
    update: {
      isActive: true
    },
    create: {
      month: 6,
      year: 2026,
      isActive: true
    }
  });
  console.log(`Seeded active assessment period: Month ${activePeriod.month}, Year ${activePeriod.year}`);

  // Seed Faculties
  for (const data of facultiesData) {
    const faculty = await prisma.faculty.upsert({
      where: { name: data.name },
      update: {
        buildingName: data.buildingName,
        description: data.description
      },
      create: {
        name: data.name,
        buildingName: data.buildingName,
        description: data.description,
        currentScore: 0.0
      }
    });
    console.log(`Seeded/Updated faculty: ${faculty.name}`);
  }

  console.log("Seeding finished successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
