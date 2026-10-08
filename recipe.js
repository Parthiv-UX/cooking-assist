/* Pre-fed recipe for the Cooking Assist prototype.
 * Source: "Bachelors spl Chicken Curry" — Chef Ranveer Brar (YouTube zmdp4DmRlIg).
 * Prepared MANUALLY (not extracted automatically):
 *   - steps & step times from the video's timestamped transcript
 *   - quantities from the creator's own video description
 * t: [start, end] seconds of the step's moment in the video. Marks saved on a phone (?mark) override these.
 */
window.RECIPE = {
  id: "zmdp4DmRlIg",
  title: "Chicken Curry",
  fullTitle: "Bachelors spl Chicken Curry | easy Chicken Curry | Chef Ranveer Brar",
  creator: "Chef Ranveer Brar",
  initials: "RB",
  platform: "YouTube",
  url: "https://youtu.be/zmdp4DmRlIg",
  aboutMin: 35,
  doneLine: "Done. Enjoy your curry.",

  // Ingredient uses. Same ingredient in two steps with different amounts = two entries
  // (e.g. chilli in the marinade vs the curry). aliases are matched in voice questions.
  ingredients: {
    onion:     { name: "Onions, chopped", qty: "3 medium", aliases: ["onion", "onions", "pyaz", "pyaaz", "kanda"] },

    tomato:    { name: "Tomatoes, diced", qty: "4 medium", aliases: ["tomato", "tomatoes", "tamatar"] },
    curdT:     { name: "Curd, beaten", qty: "2–3 tbsp", aliases: ["curd", "dahi", "yogurt", "yoghurt"] },
    stems:     { name: "Coriander stems, chopped", qty: "1 tbsp", aliases: ["coriander stem", "coriander stems", "stems", "dhania stem", "dhaniya stem", "dandi"] },
    saltT:     { name: "Salt", qty: "To taste", aliases: ["salt", "namak"] },

    chicken:   { name: "Chicken, drumsticks & thighs", qty: "1 kg", aliases: ["chicken", "murgi", "murgh", "leg piece", "leg pieces", "drumstick", "thigh", "meat"] },
    chilliM:   { name: "Degi red chilli powder", qty: "½ tsp", aliases: ["chilli", "chili", "red chilli", "chilli powder", "chili powder", "mirch", "lal mirch", "degi mirch", "degi"] },
    turmericM: { name: "Turmeric powder", qty: "1 tsp", aliases: ["turmeric", "haldi", "haldee"] },
    curdM:     { name: "Curd, beaten (optional)", qty: "2 tbsp", aliases: ["curd", "dahi", "yogurt", "yoghurt"] },
    oilM:      { name: "Oil", qty: "1 tsp", aliases: ["oil", "tel"] },
    saltM:     { name: "Salt", qty: "To taste", aliases: ["salt", "namak"] },

    ginger:    { name: "Ginger, peeled & sliced", qty: "½ inch", aliases: ["ginger", "adrak"] },
    garlic:    { name: "Garlic cloves", qty: "2–4", aliases: ["garlic", "lahsun", "lehsun", "garlic cloves"] },
    greench:   { name: "Green chillies, torn", qty: "2", aliases: ["green chilli", "green chillies", "green chili", "green chilies", "hari mirch"] },

    oil:       { name: "Oil", qty: "2 tbsp", aliases: ["oil", "tel"] },
    ghee:      { name: "Ghee", qty: "1 tbsp", aliases: ["ghee", "clarified butter", "butter"] },
    cinnamon:  { name: "Cinnamon stick", qty: "½ inch", aliases: ["cinnamon", "dalchini", "dal chini"] },
    cloves:    { name: "Cloves", qty: "2–3", aliases: ["clove", "cloves", "laung", "long"] },
    cardamom:  { name: "Green cardamom", qty: "3", aliases: ["cardamom", "elaichi", "ilaichi", "elachi"] },

    chilli:    { name: "Degi red chilli powder", qty: "1 tbsp", aliases: ["chilli", "chili", "red chilli", "chilli powder", "chili powder", "mirch", "lal mirch", "degi mirch", "degi"] },
    turmeric:  { name: "Turmeric powder", qty: "1 tsp", aliases: ["turmeric", "haldi", "haldee"] },
    coriander: { name: "Coriander powder", qty: "1 heaped tbsp", aliases: ["coriander", "coriander powder", "dhania", "dhaniya", "dhania powder"] },
    paste:     { name: "Tomato paste (Step 2)", qty: "All", aliases: ["tomato paste", "paste", "tomato puree"] },

    salt:      { name: "Salt", qty: "To taste", aliases: ["salt", "namak"] },
    sugar:     { name: "Sugar", qty: "½ tsp", aliases: ["sugar", "cheeni", "chini", "shakkar"] },

    water:     { name: "Water", qty: "1½ cups", aliases: ["water", "paani", "pani"] },
    leaves:    { name: "Coriander leaves, chopped", qty: "2 tbsp", aliases: ["coriander leaves", "leaves", "dhania patta", "dhaniya patta", "garnish", "hara dhania"] }
  },

  // type: "ingredient" | "technique" | "time"  (internal hierarchy, not user-facing modes)
  steps: [
    { title: "Chop the onions", type: "technique",
      instruction: "Chop the onions. No knife? A steel glass or mini chopper works too.",
      short: "A steel glass works if you have no knife.",
      items: ["onion"], t: [54, 101] },
    { title: "Make the tomato paste", type: "ingredient",
      instruction: "Grind tomatoes, curd, coriander stems and salt in the chopper. Keep aside.",
      short: "Grind together, keep aside.",
      items: ["tomato", "curdT", "stems", "saltT"], t: [101, 161],
      note: { kind: "recipe", text: "No tomatoes? Ranveer says use ¾ cup curd instead." } },
    { title: "Marinate the chicken", type: "ingredient",
      instruction: "Cut the middle tendon on each piece. Mix with salt, chilli, turmeric, curd and oil. Rest 10–15 min.",
      short: "Cut the tendon, mix, rest 10–15 min.",
      items: ["chicken", "saltM", "chilliM", "turmericM", "curdM", "oilM"], t: [161, 210] },
    { title: "Pound the aromatics", type: "ingredient",
      instruction: "Pound ginger, garlic, green chillies and a pinch of salt into a coarse paste.",
      short: "Pound into a coarse paste.",
      items: ["ginger", "garlic", "greench"], t: [210, 246] },
    { title: "Temper the spices", type: "ingredient",
      instruction: "Heat oil and ghee in a haandi. Add cinnamon, cloves and cardamom — careful, they splutter.",
      short: "Heat oil & ghee, add whole spices.",
      items: ["oil", "ghee", "cinnamon", "cloves", "cardamom"], t: [246, 320] },
    { title: "Brown the onions", type: "technique",
      instruction: "Add the paste, then the onions. Full flame first, then medium, until almond brown.",
      short: "Cook until almond brown.",
      items: ["onion"], t: [320, 433] },
    { title: "Add the spices", type: "ingredient",
      instruction: "Add chilli, turmeric and coriander powder. When the coriander smells cooked, add the tomato paste.",
      short: "Then the tomato paste, once the coriander smells cooked.",
      items: ["chilli", "turmeric", "coriander", "paste"], t: [433, 485] },
    { title: "Season the masala", type: "ingredient",
      instruction: "Cook until the raw tomato smell is gone. Add salt and sugar.",
      short: "Until the raw smell is gone.",
      items: ["salt", "sugar"], t: [485, 497] },
    { title: "Cook the chicken", type: "technique",
      instruction: "Add the chicken. Cook until it starts sweating, then add water to cover.",
      short: "Until it sweats, then add water.",
      items: ["chicken", "water"], t: [497, 566] },
    { title: "Simmer covered", type: "time",
      instruction: "Close the lid and cook for 10 minutes.",
      short: "Lid on, 10 minutes.",
      timer: 600, timerLabel: "Simmer", items: [], t: [566, 594] },
    { title: "Slow-cook & finish", type: "technique",
      instruction: "Lid off. Cook on a slow flame until the oil floats. Finish with coriander leaves.",
      short: "Slow flame until the oil floats.",
      items: ["leaves"], t: [594, 650] }
  ],

  // Substitutions. kind "recipe" = said by the creator; "suggestion" = pre-written cooking advice,
  // always labelled "Not from the original recipe".
  substitutions: {
    tomato:    { kind: "recipe", text: "Use ¾ cup curd instead of the tomatoes.", spoken: "Ranveer says use three quarter cup curd instead." },
    paste:     { kind: "recipe", text: "Use ¾ cup curd instead of the tomato paste.", spoken: "Ranveer says use three quarter cup curd instead." },
    curdM:     { kind: "recipe", text: "Curd in the marinade is optional. Skip it.", spoken: "The curd is optional, you can skip it." },
    curdT:     { kind: "suggestion", text: "Skip it — use only tomatoes. The paste will be a little sharper.", spoken: "Skip it and use only tomatoes." },
    ghee:      { kind: "recipe", text: "Oil, ghee or both all work.", spoken: "Oil, ghee or both all work." },
    oil:       { kind: "recipe", text: "Oil, ghee or both all work.", spoken: "Oil, ghee or both all work." },
    cinnamon:  { kind: "recipe", text: "Use any spices you put in tea — cardamom, cloves or cinnamon.", spoken: "Use any spices you put in tea." },
    cloves:    { kind: "recipe", text: "Use any spices you put in tea — cardamom, cloves or cinnamon.", spoken: "Use any spices you put in tea." },
    cardamom:  { kind: "recipe", text: "Use any spices you put in tea — cardamom, cloves or cinnamon.", spoken: "Use any spices you put in tea." },
    ginger:    { kind: "suggestion", text: "Use ½ tbsp ready ginger-garlic paste.", spoken: "You could use half a tablespoon of ginger garlic paste." },
    garlic:    { kind: "suggestion", text: "Use ½ tbsp ready ginger-garlic paste.", spoken: "You could use half a tablespoon of ginger garlic paste." },
    greench:   { kind: "suggestion", text: "Skip them, or add a pinch more red chilli powder.", spoken: "Skip them, or add a pinch more chilli powder." },
    coriander: { kind: "suggestion", text: "Skip it, or add ½ tsp garam masala at the end.", spoken: "Skip it, or add half a teaspoon of garam masala at the end." },
    chilli:    { kind: "suggestion", text: "Use regular red chilli powder, about half — it’s hotter.", spoken: "Use regular red chilli powder, about half." },
    chilliM:   { kind: "suggestion", text: "Use regular red chilli powder, about half — it’s hotter.", spoken: "Use regular red chilli powder, about half." },
    onion:     { kind: "suggestion", text: "There’s no good swap — the curry needs onions for body.", spoken: "There's no good swap for onions here." },
    sugar:     { kind: "suggestion", text: "Skip it. It only balances the tomato’s sourness.", spoken: "Skip it, it only balances the sourness." },
    turmeric:  { kind: "suggestion", text: "Skip it. The colour changes, the taste barely does.", spoken: "Skip it, the taste barely changes." },
    turmericM: { kind: "suggestion", text: "Skip it. The colour changes, the taste barely does.", spoken: "Skip it, the taste barely changes." },
    stems:     { kind: "suggestion", text: "Use a few coriander leaves, or skip it.", spoken: "Use a few coriander leaves, or skip it." },
    leaves:    { kind: "suggestion", text: "Skip it — it’s only a fresh finish.", spoken: "Skip it, it's only a fresh finish." },
    chicken:   { kind: "recipe", text: "Use bone-in pieces. Boneless makes a weaker gravy.", spoken: "Ranveer says use bone-in pieces, not boneless." }
  }
};
