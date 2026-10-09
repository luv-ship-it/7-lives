export interface Role {
    id: number;
    name: string;
    description: string;
    ability: string;
    skill: RoleSkill;
}

export type RoleSkill =
    | { type: "heal"; amount: number }
    | { type: "guard" }
    | { type: "empower"; amount: number }
    | { type: "strike"; amount: number }
    | { type: "rally"; heal: number; damage: number };

export const roles: Role[] = [
    {
        id: 1,
        name: "Doctor",
        description: "Read clues and figure out what is wrong.",
        ability: "Diagnose",
        skill: { type: "heal", amount: 2 },
    },
    {
        id: 2,
        name: "Lawyer",
        description: "Find contradictions and build a strong case.",
        ability: "Make your case",
        skill: { type: "guard" },
    },
    {
        id: 3,
        name: "Engineer",
        description: "Repair systems and turn broken parts into tools.",
        ability: "Engineer",
        skill: { type: "empower", amount: 3 },
    },
    {
        id: 4,
        name: "Athlete",
        description: "Use speed and timing to overcome obstacles.",
        ability: "Sprint",
        skill: { type: "strike", amount: 5 },
    },
    {
        id: 5,
        name: "Teacher",
        description: "Connect ideas and guide others toward a solution.",
        ability: "Explain",
        skill: { type: "rally", heal: 1, damage: 2 },
    },
    {
        id: 6,
        name: "Scientist",
        description: "Test clues, spot patterns, and make discoveries.",
        ability: "Analyze",
        skill: { type: "empower", amount: 4 },
    },
    {
        id: 7,
        name: "Chef",
        description: "Combine ingredients and improvise under pressure.",
        ability: "Create",
        skill: { type: "heal", amount: 3 },
    },
];