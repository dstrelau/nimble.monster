import type { Condition } from "@/lib/types";

export interface FormattingFixture {
  id: string;
  name: string;
  description: string;
  content: string;
  headings?: boolean;
}

export const LAB_CONDITIONS: Condition[] = [
  {
    id: "text-lab-dazed",
    name: "Dazed",
    description: "You can take one fewer action on your turn.",
    official: false,
  },
  {
    id: "text-lab-grappled",
    name: "Grappled",
    description: "Your movement is restricted by another creature.",
    official: false,
  },
];

export const FORMATTING_FIXTURES: FormattingFixture[] = [
  {
    id: "paragraphs",
    name: "Paragraph rhythm",
    description: "Three paragraphs with short, medium, and wrapped lines.",
    content:
      "The first paragraph is deliberately short.\n\nThe second paragraph is long enough to wrap at narrow widths and reveal whether line height and paragraph spacing remain distinct from ordinary browser wrapping.\n\nThe final paragraph confirms that repeated spacing remains consistent.",
  },
  {
    id: "soft-newlines",
    name: "Soft newlines",
    description:
      "Single newlines remain in one paragraph; blank lines create paragraphs.",
    content:
      "This line uses a soft newline.\nIt remains part of the same paragraph.\n\nThis begins the second paragraph.",
  },
  {
    id: "emphasis",
    name: "Emphasis combinations",
    description: "Bold, italic, and nested emphasis in realistic prose.",
    content:
      "Use **bold text** for important rules, *italic text* for voice, and ***bold italic text*** when both forms need to survive together.\n\nAn **_ACTION_** label should remain legible beside ordinary text.",
  },
  {
    id: "dice",
    name: "Dice notation",
    description: "Multiple dice sizes, modifiers, and roll modes.",
    content:
      "Deal 2d6+4 damage, regain 1d8-2 HP, then roll 3d6a with advantage, 2d8d with disadvantage, or 4d10v vicious.\n\nParenthetical dice (1d20) and **bold damage 6d6+6** should remain interactive.",
  },
  {
    id: "conditions",
    name: "Conditions",
    description: "Known, aliased, repeated, and unknown condition references.",
    content:
      "The target is [[Dazed]], then becomes [[Grappled|held in place]]. A repeated [[Dazed|dazed condition]] should resolve identically.\n\nAn [[Unknown Condition]] remains visibly marked without a tooltip definition.",
  },
  {
    id: "lists",
    name: "Nested lists",
    description: "Mixed unordered and ordered nesting with formatted content.",
    content: [
      "- Resolve the attack",
      "  1. Roll 1d20",
      "  2. Apply **damage**",
      "     - Mark the target [[Dazed]]",
      "     - Move it 2 spaces",
      "- End the action",
    ].join("\n"),
  },
  {
    id: "headings",
    name: "Heading hierarchy",
    description: "Heading levels mixed with paragraphs and lists.",
    headings: true,
    content:
      "# Primary heading\n\nIntroductory paragraph.\n\n## Secondary heading\n\nSupporting paragraph.\n\n### Tertiary heading\n\n- First detail\n- Second detail",
  },
  {
    id: "combined",
    name: "Combined rules text",
    description: "A realistic document combining the supported syntax.",
    content:
      "**_ACTION_ — Arcane Detonation.** Choose a creature within Range 6 and deal **2d6+4** damage. The target becomes [[Dazed|dazed]] until the end of its next turn.\n\nOn a critical hit:\n- Deal an additional 1d6 damage.\n- Push the target 2 spaces.\n- If it collides with a creature, both become [[Grappled|entangled]].\n\n*The air continues to crackle after the spell resolves.*",
  },
  {
    id: "malformed",
    name: "Malformed input",
    description:
      "Incomplete formatting tokens should degrade to readable text.",
    content:
      "Incomplete **bold, dangling *emphasis, [[condition, @monster:, d6, and 1d notation remain readable.\n\nValid **formatting** and [[Dazed]] after malformed text should still render.",
  },
  {
    id: "long-content",
    name: "Long-form wrapping",
    description:
      "Dense prose checks narrow widths, vertical rhythm, and inline token wrapping.",
    content:
      "When the ancient mechanism awakens, every creature in the chamber must decide whether to retreat through the collapsing passage or remain beside the control panel. A creature that remains can spend an action to attempt a difficult check, taking 2d10+3 damage and becoming [[Dazed]] on a failure.\n\nCreatures behind cover reduce the damage by 1d6, while creatures carrying the resonant key roll 2d20a and use the higher result. This paragraph intentionally contains enough ordinary prose to wrap repeatedly without relying on artificial unbroken strings.",
  },
];
