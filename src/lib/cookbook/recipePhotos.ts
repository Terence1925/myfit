// Which recipes have a photo (a file at /recipes/<id>.jpg in the public folder), and who took it. Written by scripts/fetch-recipe-photos.mjs.
// Photos are from free stock-photo sites (Pixabay, Pexels), free to use in apps.
export const PHOTO_IDS: ReadonlySet<string> = new Set<string>([
  "apple-cinnamon-overnight-oats",
  "apple-peanut-butter-slices",
  "avocado-egg-toast",
  "baked-cinnamon-apples",
  "baked-fish-sweet-potato",
  "baked-sweet-potato-fries",
  "banana-bread-protein-muffins",
  "banana-oat-cookies",
  "banana-walnut-baked-oatmeal",
  "bangus-sisig-lite",
  "beef-and-broccoli",
  "beef-mushroom-lettuce-wraps",
  "beef-sweet-potato-skillet",
  "berry-cheesecake-protein-cups",
  "berry-overnight-oats",
  "brownie-batter-oat-bites",
  "caprese-chicken",
  "cheese-egg-bites",
  "chicken-afritada-light",
  "chicken-caesar-wrap",
  "chicken-fajita-bowl",
  "chicken-pancit-bihon",
  "chicken-quinoa-power-bowl",
  "chicken-salad-lettuce-cups",
  "chicken-sinigang-light",
  "chicken-tinola",
  "chickpea-spinach-curry",
  "choc-pb-protein-mug-brownie",
  "choco-banana-protein-shake",
  "chocolate-avocado-pudding",
  "chocolate-chia-protein-pudding",
  "chocolate-frozen-banana-bites",
  "cookie-dough-protein-bites",
  "cottage-cheese-berry-bowl",
  "cottage-cheese-oat-pancakes",
  "cottage-cheese-strawberry-ice-cream",
  "cottage-cheese-tomato-toast",
  "creamy-mushroom-chicken",
  "crunchy-roasted-chickpeas",
  "egg-fried-cauliflower-rice",
  "egg-white-veggie-wrap",
  "eggs-and-edamame",
  "fluffy-protein-pancakes",
  "garlic-rice-tomato-omelette",
  "garlic-shrimp-fried-rice",
  "greek-chicken-salad",
  "greek-yogurt-chocolate-mousse",
  "grilled-chicken-rice-bowl",
  "healthy-tapsilog",
  "hearty-lentil-soup",
  "hummus-veggie-box",
  "lean-chicken-adobo",
  "lemon-garlic-chicken-and-veg",
  "lemon-herb-salmon-asparagus",
  "mango-chia-jar",
  "mango-protein-smoothie-bowl",
  "pb-banana-nice-cream",
  "pb-banana-oatmeal",
  "peanut-butter-banana-shake",
  "peanut-butter-protein-cookies",
  "pinakbet-with-shrimp",
  "pineapple-cottage-cheese-bowl",
  "protein-french-toast",
  "protein-ice-cream",
  "raspberry-yogurt-popsicles",
  "salmon-quinoa-salad",
  "shakshuka",
  "shrimp-zucchini-noodles",
  "sinigang-na-hipon",
  "spinach-feta-egg-muffins",
  "strawberry-banana-protein-smoothie",
  "stuffed-bell-peppers",
  "sweet-potato-avocado-egg-toast",
  "sweet-potato-egg-hash",
  "teriyaki-salmon-bowl",
  "tilapia-cabbage-tacos",
  "tofu-peanut-noodle-bowl",
  "tofu-veggie-scramble",
  "tofu-veggie-stir-fry",
  "tuna-avocado-toast",
  "tuna-cucumber-boats",
  "tuna-egg-pandesal",
  "tuna-pasta-salad",
  "tuna-poke-bowl",
  "turkey-burgers-sweet-potato-wedges",
  "turkey-chili",
  "turkey-meatballs-cauli-rice",
  "veggie-breakfast-burrito",
  "veggie-egg-white-omelette",
  "veggie-fried-quinoa",
  "yogurt-berry-bark",
  "yogurt-berry-parfait",
  "yogurt-veggie-dip"
])

export const PHOTO_CREDITS: Record<string, { name: string; url: string; source: string }> = {
  "apple-cinnamon-overnight-oats": {
    "name": "bzwei",
    "url": "https://pixabay.com/users/bzwei-573146/",
    "source": "Pixabay"
  },
  "apple-peanut-butter-slices": {
    "name": "cgdsro",
    "url": "https://pixabay.com/users/cgdsro-3080762/",
    "source": "Pixabay"
  },
  "avocado-egg-toast": {
    "name": "FoodieFactor",
    "url": "https://pixabay.com/users/FoodieFactor-5992183/",
    "source": "Pixabay"
  },
  "baked-cinnamon-apples": {
    "name": "RitaE",
    "url": "https://pixabay.com/users/RitaE-19628/",
    "source": "Pixabay"
  },
  "baked-fish-sweet-potato": {
    "name": "eatde",
    "url": "https://pixabay.com/users/eatde-31315809/",
    "source": "Pixabay"
  },
  "baked-sweet-potato-fries": {
    "name": "planet_fox",
    "url": "https://pixabay.com/users/planet_fox-4691618/",
    "source": "Pixabay"
  },
  "banana-bread-protein-muffins": {
    "name": "tehzeebkazmii",
    "url": "https://pixabay.com/users/tehzeebkazmii-46957846/",
    "source": "Pixabay"
  },
  "banana-oat-cookies": {
    "name": "28366294",
    "url": "https://pixabay.com/users/28366294-28366294/",
    "source": "Pixabay"
  },
  "banana-walnut-baked-oatmeal": {
    "name": "congerdesign",
    "url": "https://pixabay.com/users/congerdesign-509903/",
    "source": "Pixabay"
  },
  "bangus-sisig-lite": {
    "name": "KavindaF",
    "url": "https://pixabay.com/users/KavindaF-15230228/",
    "source": "Pixabay"
  },
  "beef-and-broccoli": {
    "name": "LAWJR",
    "url": "https://pixabay.com/users/LAWJR-4448871/",
    "source": "Pixabay"
  },
  "beef-mushroom-lettuce-wraps": {
    "name": "angelorosa",
    "url": "https://pixabay.com/users/angelorosa-4392745/",
    "source": "Pixabay"
  },
  "beef-sweet-potato-skillet": {
    "name": "Mondgesicht",
    "url": "https://pixabay.com/users/Mondgesicht-2086402/",
    "source": "Pixabay"
  },
  "berry-cheesecake-protein-cups": {
    "name": "cpenzin",
    "url": "https://pixabay.com/users/cpenzin-4550434/",
    "source": "Pixabay"
  },
  "berry-overnight-oats": {
    "name": "bubithebear",
    "url": "https://pixabay.com/users/bubithebear-8531309/",
    "source": "Pixabay"
  },
  "brownie-batter-oat-bites": {
    "name": "anasegota",
    "url": "https://pixabay.com/users/anasegota-1364056/",
    "source": "Pixabay"
  },
  "caprese-chicken": {
    "name": "designermikele",
    "url": "https://pixabay.com/users/designermikele-5524441/",
    "source": "Pixabay"
  },
  "cheese-egg-bites": {
    "name": "RitaE",
    "url": "https://pixabay.com/users/RitaE-19628/",
    "source": "Pixabay"
  },
  "chicken-afritada-light": {
    "name": "dbaezol",
    "url": "https://pixabay.com/users/dbaezol-1535733/",
    "source": "Pixabay"
  },
  "chicken-caesar-wrap": {
    "name": "tehzeebkazmii",
    "url": "https://pixabay.com/users/tehzeebkazmii-46957846/",
    "source": "Pixabay"
  },
  "chicken-fajita-bowl": {
    "name": "Ragabz",
    "url": "https://pixabay.com/users/Ragabz-19706270/",
    "source": "Pixabay"
  },
  "chicken-pancit-bihon": {
    "name": "jonathanvalencia5",
    "url": "https://pixabay.com/users/jonathanvalencia5-4638583/",
    "source": "Pixabay"
  },
  "chicken-quinoa-power-bowl": {
    "name": "Wow_Pho",
    "url": "https://pixabay.com/users/Wow_Pho-916237/",
    "source": "Pixabay"
  },
  "chicken-salad-lettuce-cups": {
    "name": "Wow_Pho",
    "url": "https://pixabay.com/users/Wow_Pho-916237/",
    "source": "Pixabay"
  },
  "chicken-sinigang-light": {
    "name": "MichWich",
    "url": "https://pixabay.com/users/MichWich-36808266/",
    "source": "Pixabay"
  },
  "chicken-tinola": {
    "name": "Vu_Pham",
    "url": "https://pixabay.com/users/Vu_Pham-23678517/",
    "source": "Pixabay"
  },
  "chickpea-spinach-curry": {
    "name": "Anilsharma26",
    "url": "https://pixabay.com/users/Anilsharma26-13475484/",
    "source": "Pixabay"
  },
  "choc-pb-protein-mug-brownie": {
    "name": "MissSuki",
    "url": "https://pixabay.com/users/MissSuki-9359250/",
    "source": "Pixabay"
  },
  "choco-banana-protein-shake": {
    "name": "stevepb",
    "url": "https://pixabay.com/users/stevepb-282134/",
    "source": "Pixabay"
  },
  "chocolate-avocado-pudding": {
    "name": "Anrita1705",
    "url": "https://pixabay.com/users/Anrita1705-11109462/",
    "source": "Pixabay"
  },
  "chocolate-chia-protein-pudding": {
    "name": "tomwieden",
    "url": "https://pixabay.com/users/tomwieden-26234/",
    "source": "Pixabay"
  },
  "chocolate-frozen-banana-bites": {
    "name": "manfredrichter",
    "url": "https://pixabay.com/users/manfredrichter-4055600/",
    "source": "Pixabay"
  },
  "cookie-dough-protein-bites": {
    "name": "dmarr515",
    "url": "https://pixabay.com/users/dmarr515-16334776/",
    "source": "Pixabay"
  },
  "cottage-cheese-berry-bowl": {
    "name": "mandarinMD",
    "url": "https://pixabay.com/users/mandarinMD-5643912/",
    "source": "Pixabay"
  },
  "cottage-cheese-oat-pancakes": {
    "name": "Pexels",
    "url": "https://pixabay.com/users/Pexels-2286921/",
    "source": "Pixabay"
  },
  "cottage-cheese-strawberry-ice-cream": {
    "name": "silviarita",
    "url": "https://pixabay.com/users/silviarita-3142410/",
    "source": "Pixabay"
  },
  "cottage-cheese-tomato-toast": {
    "name": "amiraxgelcola",
    "url": "https://pixabay.com/users/amiraxgelcola-13484139/",
    "source": "Pixabay"
  },
  "creamy-mushroom-chicken": {
    "name": "Levoqd",
    "url": "https://pixabay.com/users/Levoqd-117647/",
    "source": "Pixabay"
  },
  "crunchy-roasted-chickpeas": {
    "name": "Engin_Akyurt",
    "url": "https://pixabay.com/users/Engin_Akyurt-3656355/",
    "source": "Pixabay"
  },
  "egg-fried-cauliflower-rice": {
    "name": "sharonang",
    "url": "https://pixabay.com/users/sharonang-99559/",
    "source": "Pixabay"
  },
  "egg-white-veggie-wrap": {
    "name": "ponce_photography",
    "url": "https://pixabay.com/users/ponce_photography-2473530/",
    "source": "Pixabay"
  },
  "eggs-and-edamame": {
    "name": "RitaE",
    "url": "https://pixabay.com/users/RitaE-19628/",
    "source": "Pixabay"
  },
  "fluffy-protein-pancakes": {
    "name": "Leolo212",
    "url": "https://pixabay.com/users/Leolo212-15013188/",
    "source": "Pixabay"
  },
  "garlic-rice-tomato-omelette": {
    "name": "Rierosa222",
    "url": "https://pixabay.com/users/Rierosa222-5673828/",
    "source": "Pixabay"
  },
  "garlic-shrimp-fried-rice": {
    "name": "araf60plus",
    "url": "https://pixabay.com/users/araf60plus-30984832/",
    "source": "Pixabay"
  },
  "greek-chicken-salad": {
    "name": "galyafanaseva",
    "url": "https://pixabay.com/users/galyafanaseva-19830457/",
    "source": "Pixabay"
  },
  "greek-yogurt-chocolate-mousse": {
    "name": "DanielaElenaTentis",
    "url": "https://pixabay.com/users/DanielaElenaTentis-2743349/",
    "source": "Pixabay"
  },
  "grilled-chicken-rice-bowl": {
    "name": "tookapic",
    "url": "https://pixabay.com/users/tookapic-1386459/",
    "source": "Pixabay"
  },
  "healthy-tapsilog": {
    "name": "sharonang",
    "url": "https://pixabay.com/users/sharonang-99559/",
    "source": "Pixabay"
  },
  "hearty-lentil-soup": {
    "name": "mygraphx",
    "url": "https://pixabay.com/users/mygraphx-1295235/",
    "source": "Pixabay"
  },
  "hummus-veggie-box": {
    "name": "ctwtn",
    "url": "https://pixabay.com/users/ctwtn-479476/",
    "source": "Pixabay"
  },
  "lean-chicken-adobo": {
    "name": "jonathanvalencia5",
    "url": "https://pixabay.com/users/jonathanvalencia5-4638583/",
    "source": "Pixabay"
  },
  "lemon-garlic-chicken-and-veg": {
    "name": "RitaE",
    "url": "https://pixabay.com/users/RitaE-19628/",
    "source": "Pixabay"
  },
  "lemon-herb-salmon-asparagus": {
    "name": "nedrafols",
    "url": "https://pixabay.com/users/nedrafols-15032032/",
    "source": "Pixabay"
  },
  "mango-chia-jar": {
    "name": "Monfocus",
    "url": "https://pixabay.com/users/Monfocus-2516394/",
    "source": "Pixabay"
  },
  "mango-protein-smoothie-bowl": {
    "name": "StockSnap",
    "url": "https://pixabay.com/users/StockSnap-894430/",
    "source": "Pixabay"
  },
  "pb-banana-nice-cream": {
    "name": "Virgmo99",
    "url": "https://pixabay.com/users/Virgmo99-12723986/",
    "source": "Pixabay"
  },
  "pb-banana-oatmeal": {
    "name": "congerdesign",
    "url": "https://pixabay.com/users/congerdesign-509903/",
    "source": "Pixabay"
  },
  "peanut-butter-banana-shake": {
    "name": "aymanfakhry1999",
    "url": "https://pixabay.com/users/aymanfakhry1999-11277305/",
    "source": "Pixabay"
  },
  "peanut-butter-protein-cookies": {
    "name": "mccartyv",
    "url": "https://pixabay.com/users/mccartyv-445047/",
    "source": "Pixabay"
  },
  "pinakbet-with-shrimp": {
    "name": "TeeFarm",
    "url": "https://pixabay.com/users/TeeFarm-199315/",
    "source": "Pixabay"
  },
  "pineapple-cottage-cheese-bowl": {
    "name": "mandarinMD",
    "url": "https://pixabay.com/users/mandarinMD-5643912/",
    "source": "Pixabay"
  },
  "protein-french-toast": {
    "name": "marcelokato",
    "url": "https://pixabay.com/users/marcelokato-4416261/",
    "source": "Pixabay"
  },
  "protein-ice-cream": {
    "name": "silviarita",
    "url": "https://pixabay.com/users/silviarita-3142410/",
    "source": "Pixabay"
  },
  "raspberry-yogurt-popsicles": {
    "name": "silviarita",
    "url": "https://pixabay.com/users/silviarita-3142410/",
    "source": "Pixabay"
  },
  "salmon-quinoa-salad": {
    "name": "romjanaly",
    "url": "https://pixabay.com/users/romjanaly-19799828/",
    "source": "Pixabay"
  },
  "shakshuka": {
    "name": "DanielaElenaTentis",
    "url": "https://pixabay.com/users/DanielaElenaTentis-2743349/",
    "source": "Pixabay"
  },
  "shrimp-zucchini-noodles": {
    "name": "sarah4385",
    "url": "https://pixabay.com/users/sarah4385-5240550/",
    "source": "Pixabay"
  },
  "sinigang-na-hipon": {
    "name": "hidepose",
    "url": "https://pixabay.com/users/hidepose-2734059/",
    "source": "Pixabay"
  },
  "spinach-feta-egg-muffins": {
    "name": "RitaE",
    "url": "https://pixabay.com/users/RitaE-19628/",
    "source": "Pixabay"
  },
  "strawberry-banana-protein-smoothie": {
    "name": "RitaE",
    "url": "https://pixabay.com/users/RitaE-19628/",
    "source": "Pixabay"
  },
  "stuffed-bell-peppers": {
    "name": "RitaE",
    "url": "https://pixabay.com/users/RitaE-19628/",
    "source": "Pixabay"
  },
  "sweet-potato-avocado-egg-toast": {
    "name": "romjanaly",
    "url": "https://pixabay.com/users/romjanaly-19799828/",
    "source": "Pixabay"
  },
  "sweet-potato-egg-hash": {
    "name": "Mondgesicht",
    "url": "https://pixabay.com/users/Mondgesicht-2086402/",
    "source": "Pixabay"
  },
  "teriyaki-salmon-bowl": {
    "name": "6676394",
    "url": "https://pixabay.com/users/6676394-6676394/",
    "source": "Pixabay"
  },
  "tilapia-cabbage-tacos": {
    "name": "savortonight",
    "url": "https://pixabay.com/users/savortonight-890668/",
    "source": "Pixabay"
  },
  "tofu-peanut-noodle-bowl": {
    "name": "backsp_ace",
    "url": "https://pixabay.com/users/backsp_ace-45138255/",
    "source": "Pixabay"
  },
  "tofu-veggie-scramble": {
    "name": "sontung57",
    "url": "https://pixabay.com/users/sontung57-19733131/",
    "source": "Pixabay"
  },
  "tofu-veggie-stir-fry": {
    "name": "sontung57",
    "url": "https://pixabay.com/users/sontung57-19733131/",
    "source": "Pixabay"
  },
  "tuna-avocado-toast": {
    "name": "amiraxgelcola",
    "url": "https://pixabay.com/users/amiraxgelcola-13484139/",
    "source": "Pixabay"
  },
  "tuna-cucumber-boats": {
    "name": "RitaE",
    "url": "https://pixabay.com/users/RitaE-19628/",
    "source": "Pixabay"
  },
  "tuna-egg-pandesal": {
    "name": "mp1746",
    "url": "https://pixabay.com/users/mp1746-3022388/",
    "source": "Pixabay"
  },
  "tuna-pasta-salad": {
    "name": "Pexels",
    "url": "https://pixabay.com/users/Pexels-2286921/",
    "source": "Pixabay"
  },
  "tuna-poke-bowl": {
    "name": "6676394",
    "url": "https://pixabay.com/users/6676394-6676394/",
    "source": "Pixabay"
  },
  "turkey-burgers-sweet-potato-wedges": {
    "name": "niekverlaan",
    "url": "https://pixabay.com/users/niekverlaan-80788/",
    "source": "Pixabay"
  },
  "turkey-chili": {
    "name": "kalhh",
    "url": "https://pixabay.com/users/kalhh-86169/",
    "source": "Pixabay"
  },
  "turkey-meatballs-cauli-rice": {
    "name": "summerstock",
    "url": "https://pixabay.com/users/summerstock-79075/",
    "source": "Pixabay"
  },
  "veggie-breakfast-burrito": {
    "name": "nevena313",
    "url": "https://pixabay.com/users/nevena313-2640538/",
    "source": "Pixabay"
  },
  "veggie-egg-white-omelette": {
    "name": "CrafterChef",
    "url": "https://pixabay.com/users/CrafterChef-39580535/",
    "source": "Pixabay"
  },
  "veggie-fried-quinoa": {
    "name": "Einladung_zum_Essen",
    "url": "https://pixabay.com/users/Einladung_zum_Essen-3625323/",
    "source": "Pixabay"
  },
  "yogurt-berry-bark": {
    "name": "lizziet5",
    "url": "https://pixabay.com/users/lizziet5-2690626/",
    "source": "Pixabay"
  },
  "yogurt-berry-parfait": {
    "name": "tehzeebkazmii",
    "url": "https://pixabay.com/users/tehzeebkazmii-46957846/",
    "source": "Pixabay"
  },
  "yogurt-veggie-dip": {
    "name": "congerdesign",
    "url": "https://pixabay.com/users/congerdesign-509903/",
    "source": "Pixabay"
  }
}
