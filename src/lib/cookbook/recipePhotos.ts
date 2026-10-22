// Which recipes have a photo (a file at /recipes/<id>.jpg in the public folder), and who took it. Written by scripts/fetch-recipe-photos.mjs.
// Photos are from free stock-photo sites (Pixabay, Pexels), free to use in apps.
export const PHOTO_IDS: ReadonlySet<string> = new Set<string>([
  "avocado-egg-toast",
  "baked-fish-sweet-potato",
  "banana-bread-protein-muffins",
  "bangus-sisig-lite",
  "beef-and-broccoli",
  "beef-mushroom-lettuce-wraps",
  "berry-cheesecake-protein-cups",
  "berry-overnight-oats",
  "chicken-afritada-light",
  "chicken-caesar-wrap",
  "chicken-fajita-bowl",
  "chicken-salad-lettuce-cups",
  "chicken-tinola",
  "choc-pb-protein-mug-brownie",
  "choco-banana-protein-shake",
  "chocolate-chia-protein-pudding",
  "cookie-dough-protein-bites",
  "cottage-cheese-berry-bowl",
  "cottage-cheese-strawberry-ice-cream",
  "egg-fried-cauliflower-rice",
  "eggs-and-edamame",
  "fluffy-protein-pancakes",
  "grilled-chicken-rice-bowl",
  "healthy-tapsilog",
  "hummus-veggie-box",
  "lean-chicken-adobo",
  "lemon-garlic-chicken-and-veg",
  "mango-protein-smoothie-bowl",
  "peanut-butter-protein-cookies",
  "pinakbet-with-shrimp",
  "protein-french-toast",
  "protein-ice-cream",
  "sinigang-na-hipon",
  "sweet-potato-egg-hash",
  "teriyaki-salmon-bowl",
  "tofu-veggie-stir-fry",
  "tuna-cucumber-boats",
  "tuna-egg-pandesal",
  "tuna-poke-bowl",
  "turkey-meatballs-cauli-rice",
  "veggie-egg-white-omelette",
  "yogurt-berry-bark",
  "yogurt-berry-parfait"
])

export const PHOTO_CREDITS: Record<string, { name: string; url: string; source: string }> = {
  "cookie-dough-protein-bites": {
    "name": "dmarr515",
    "url": "https://pixabay.com/users/dmarr515-16334776/",
    "source": "Pixabay"
  },
  "fluffy-protein-pancakes": {
    "name": "Leolo212",
    "url": "https://pixabay.com/users/Leolo212-15013188/",
    "source": "Pixabay"
  },
  "protein-ice-cream": {
    "name": "silviarita",
    "url": "https://pixabay.com/users/silviarita-3142410/",
    "source": "Pixabay"
  },
  "cottage-cheese-strawberry-ice-cream": {
    "name": "silviarita",
    "url": "https://pixabay.com/users/silviarita-3142410/",
    "source": "Pixabay"
  },
  "chocolate-chia-protein-pudding": {
    "name": "tomwieden",
    "url": "https://pixabay.com/users/tomwieden-26234/",
    "source": "Pixabay"
  },
  "banana-bread-protein-muffins": {
    "name": "tehzeebkazmii",
    "url": "https://pixabay.com/users/tehzeebkazmii-46957846/",
    "source": "Pixabay"
  },
  "protein-french-toast": {
    "name": "marcelokato",
    "url": "https://pixabay.com/users/marcelokato-4416261/",
    "source": "Pixabay"
  },
  "mango-protein-smoothie-bowl": {
    "name": "StockSnap",
    "url": "https://pixabay.com/users/StockSnap-894430/",
    "source": "Pixabay"
  },
  "peanut-butter-protein-cookies": {
    "name": "mccartyv",
    "url": "https://pixabay.com/users/mccartyv-445047/",
    "source": "Pixabay"
  },
  "veggie-egg-white-omelette": {
    "name": "CrafterChef",
    "url": "https://pixabay.com/users/CrafterChef-39580535/",
    "source": "Pixabay"
  },
  "berry-overnight-oats": {
    "name": "bubithebear",
    "url": "https://pixabay.com/users/bubithebear-8531309/",
    "source": "Pixabay"
  },
  "avocado-egg-toast": {
    "name": "FoodieFactor",
    "url": "https://pixabay.com/users/FoodieFactor-5992183/",
    "source": "Pixabay"
  },
  "sweet-potato-egg-hash": {
    "name": "Mondgesicht",
    "url": "https://pixabay.com/users/Mondgesicht-2086402/",
    "source": "Pixabay"
  },
  "yogurt-berry-parfait": {
    "name": "tehzeebkazmii",
    "url": "https://pixabay.com/users/tehzeebkazmii-46957846/",
    "source": "Pixabay"
  },
  "chicken-tinola": {
    "name": "Vu_Pham",
    "url": "https://pixabay.com/users/Vu_Pham-23678517/",
    "source": "Pixabay"
  },
  "lean-chicken-adobo": {
    "name": "jonathanvalencia5",
    "url": "https://pixabay.com/users/jonathanvalencia5-4638583/",
    "source": "Pixabay"
  },
  "teriyaki-salmon-bowl": {
    "name": "6676394",
    "url": "https://pixabay.com/users/6676394-6676394/",
    "source": "Pixabay"
  },
  "beef-and-broccoli": {
    "name": "LAWJR",
    "url": "https://pixabay.com/users/LAWJR-4448871/",
    "source": "Pixabay"
  },
  "turkey-meatballs-cauli-rice": {
    "name": "summerstock",
    "url": "https://pixabay.com/users/summerstock-79075/",
    "source": "Pixabay"
  },
  "tofu-veggie-stir-fry": {
    "name": "sontung57",
    "url": "https://pixabay.com/users/sontung57-19733131/",
    "source": "Pixabay"
  },
  "tuna-poke-bowl": {
    "name": "6676394",
    "url": "https://pixabay.com/users/6676394-6676394/",
    "source": "Pixabay"
  },
  "egg-fried-cauliflower-rice": {
    "name": "sharonang",
    "url": "https://pixabay.com/users/sharonang-99559/",
    "source": "Pixabay"
  },
  "chicken-caesar-wrap": {
    "name": "tehzeebkazmii",
    "url": "https://pixabay.com/users/tehzeebkazmii-46957846/",
    "source": "Pixabay"
  },
  "chicken-afritada-light": {
    "name": "dbaezol",
    "url": "https://pixabay.com/users/dbaezol-1535733/",
    "source": "Pixabay"
  },
  "baked-fish-sweet-potato": {
    "name": "eatde",
    "url": "https://pixabay.com/users/eatde-31315809/",
    "source": "Pixabay"
  },
  "beef-mushroom-lettuce-wraps": {
    "name": "angelorosa",
    "url": "https://pixabay.com/users/angelorosa-4392745/",
    "source": "Pixabay"
  },
  "tuna-cucumber-boats": {
    "name": "RitaE",
    "url": "https://pixabay.com/users/RitaE-19628/",
    "source": "Pixabay"
  },
  "hummus-veggie-box": {
    "name": "ctwtn",
    "url": "https://pixabay.com/users/ctwtn-479476/",
    "source": "Pixabay"
  },
  "cottage-cheese-berry-bowl": {
    "name": "mandarinMD",
    "url": "https://pixabay.com/users/mandarinMD-5643912/",
    "source": "Pixabay"
  },
  "eggs-and-edamame": {
    "name": "RitaE",
    "url": "https://pixabay.com/users/RitaE-19628/",
    "source": "Pixabay"
  },
  "yogurt-berry-bark": {
    "name": "lizziet5",
    "url": "https://pixabay.com/users/lizziet5-2690626/",
    "source": "Pixabay"
  },
  "choc-pb-protein-mug-brownie": {
    "name": "MissSuki",
    "url": "https://pixabay.com/users/MissSuki-9359250/",
    "source": "Pixabay"
  },
  "berry-cheesecake-protein-cups": {
    "name": "cpenzin",
    "url": "https://pixabay.com/users/cpenzin-4550434/",
    "source": "Pixabay"
  },
  "healthy-tapsilog": {
    "name": "sharonang",
    "url": "https://pixabay.com/users/sharonang-99559/",
    "source": "Pixabay"
  },
  "tuna-egg-pandesal": {
    "name": "mp1746",
    "url": "https://pixabay.com/users/mp1746-3022388/",
    "source": "Pixabay"
  },
  "sinigang-na-hipon": {
    "name": "hidepose",
    "url": "https://pixabay.com/users/hidepose-2734059/",
    "source": "Pixabay"
  },
  "grilled-chicken-rice-bowl": {
    "name": "tookapic",
    "url": "https://pixabay.com/users/tookapic-1386459/",
    "source": "Pixabay"
  },
  "bangus-sisig-lite": {
    "name": "KavindaF",
    "url": "https://pixabay.com/users/KavindaF-15230228/",
    "source": "Pixabay"
  },
  "pinakbet-with-shrimp": {
    "name": "TeeFarm",
    "url": "https://pixabay.com/users/TeeFarm-199315/",
    "source": "Pixabay"
  },
  "chicken-fajita-bowl": {
    "name": "Ragabz",
    "url": "https://pixabay.com/users/Ragabz-19706270/",
    "source": "Pixabay"
  },
  "lemon-garlic-chicken-and-veg": {
    "name": "RitaE",
    "url": "https://pixabay.com/users/RitaE-19628/",
    "source": "Pixabay"
  },
  "choco-banana-protein-shake": {
    "name": "stevepb",
    "url": "https://pixabay.com/users/stevepb-282134/",
    "source": "Pixabay"
  },
  "chicken-salad-lettuce-cups": {
    "name": "Wow_Pho",
    "url": "https://pixabay.com/users/Wow_Pho-916237/",
    "source": "Pixabay"
  }
}
