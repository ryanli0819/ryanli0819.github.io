/* =====================================================================
   SITE CONTENT — edit this file to update the website.
   Everything on the page (projects, timeline, fun side) is built from
   the data below, so you never have to touch the HTML.

   • `missing` lists what still needs to be filled in for each project.
     Each list shows up as a dashed "Info needed" box inside that project's
     "More info" dropdown. Delete an item once you have added the info.
   • Set SHOW_MISSING_INFO to false before you publish if you'd rather
     visitors not see the "Info needed" boxes.
   • Links: add { label, url } objects to `links`. Never leave a fake URL.
   ===================================================================== */

window.SHOW_MISSING_INFO = false;

/* Visitor analytics (GoatCounter: free, no cookies, privacy-friendly).
   1. Sign up at https://www.goatcounter.com/signup and pick a code, e.g. "ryanli".
   2. Put that code below. Your dashboard is then at https://<code>.goatcounter.com
   3. Optional: in GoatCounter Settings, tick "Allow adding visitor counts on your
      website" to show the public visitor counter in the footer. */
window.ANALYTICS = { goatcounter: "" };

window.SITE = {
  /* ---------------------------------------------------------------
     PURDUE · DATA ANALYTICS (work side, right after the intro)
     --------------------------------------------------------------- */
  purdue: {
    degree: "B.S. Data Analytics Application and Technology",
    college: "Purdue Polytechnic Institute",
    place: "West Lafayette, IN",
    grad: "Expected May 2030",
    why: "I'm heading into data science because the interesting part of every project I've done was the data: messy bullet-chat logs, labeled hockey film, warehouse counts that didn't add up. I want to get really good at exploring, cleaning and organizing that kind of data so industries and businesses can make clearer decisions with it.",
    tracks: [
      { code: "DM", title: "The Data Mine", tag: "Learning community · ongoing",
        text: "Purdue's data-science learning community. I'm building SQL and data-processing fundamentals through hands-on project work with real-world datasets, alongside faculty and industry partners.",
        link: { label: "About The Data Mine", url: "https://datamine.purdue.edu/" } },
      { code: "FS", title: "Flight-simulator data", tag: "Research & data work · ongoing",
        text: "Preprocessing and cleaning data exported from Purdue's aviation flight simulators for a Bay Area company training an AI system that helps student pilots learn to fly. Structuring and validating it for machine learning.",
        link: { label: "See the project", url: "#p-aviation" } },
      { code: "DS", title: "Direction: data science", tag: "Where this is going",
        text: "Exploratory data analysis and data quality first, then modeling. The goal is analysis that people in a business can actually act on, not just a good score.",
        link: null }
    ],
    pipeline: [
      { stage: "Collect", what: "Gather and label raw data", from: ["Hand-labeled hockey film (ground truth)", "Bullet-chat logs from Douyu live streams", "Daily warehouse counts"] },
      { stage: "Clean", what: "Fix, structure, validate", from: ["Flight-simulator exports for an AI flight tutor", "Iterative label cleanup in the ASABC paper"] },
      { stage: "Explore", what: "Find what the data is saying", from: ["EDA on inventory discrepancies at Ventrix", "Titanic survival patterns by class and sex"] },
      { stage: "Model", what: "Train and evaluate", from: ["CNN + YOLO for teams and roles", "Few-shot prompt-tuned LLM", "Titanic classifier"] },
      { stage: "Decide", what: "Turn it into action", from: ["Restocking calls and shipping checks", "Frame-by-frame play review", "Flagging negative chat for moderators"] }
    ],
    before: [
      { k: "High school", v: "Lexington High School, Lexington, MA" },
      { k: "GPA", v: "3.78 unweighted (no weighted GPA offered) · most rigorous course load available" },
      { k: "SAT", v: "1530 (800 Math)" },
      { k: "Research", v: "IEEE AIxHeart 2024 co-author · IEYI China Distinction Award" }
    ]
  },

  person: {
    name: "Ryan Li",
    school: "Purdue University · Purdue Polytechnic Institute",
    degree: "B.S. Data Analytics Application and Technology",
    grad: "Expected May 2030",
    location: "West Lafayette, IN · from Lexington, MA",
    email: "ryanli08199@gmail.com",
    github: "https://github.com/ryanli0819",
    resume: "assets/resume/Ryan_Li_Resume.pdf",
    photo: "assets/img/ryan-aix.jpg",
    bio: [
      "I'm a data analytics student at Purdue who gets weirdly excited about messy data. In high school I co-wrote an IEEE paper that taught a large language model to read live-stream chat (yes, it learned that \"666\" and \"2333\" are good vibes), then built a computer-vision model that tells hockey teams apart by their jerseys, which won a Distinction Award at IEYI China.",
      "When I'm not wrangling datasets, I'm surfing, on the ice as a left wing, throwing a frisbee, making art, or singing (loudly, and well, I promise)."
    ],
    missing: [
      "A headshot or photo for this section (drop it in assets/img/ and set person.photo)",
      "A few sentences in your own voice: what draws you to data science, and what a visitor should know about you in five seconds"
    ]
  },

  stats: [
    { value: "1", label: "IEEE published paper" },
    { value: "90%+", label: "CV classification accuracy" },
    { value: "100%", label: "Kaggle Titanic public score" },
    { value: "2nd", label: "State YES pitch competition" }
  ],

  skills: {
    "Languages": ["Python", "C++", "Java", "R (basic)", "SQL"],
    "ML & AI": ["CNNs", "YOLO", "PyTorch", "LLM prompt-tuning", "Computer vision"],
    "Data": ["Preprocessing pipelines", "Exploratory data analysis", "Data validation", "Statistics"]
  },

  /* ---------------------------------------------------------------
     PROJECTS
     era: "hs" (high school) | "college" | "work"
     tags: used by the filter chips
     --------------------------------------------------------------- */
  projects: [
    {
      id: "asabc",
      problem: "Live streams on Douyu are covered in \"bullet chat\": thousands of tiny comments flying across the video. Moderating the negative ones by hand doesn't scale, and keyword filters miss the memes, slang and sarcasm that carry most of the meaning.",
      time: "Summer after Grade 11 · 30 hrs/week for 9 weeks (about 270 hours)",
      learned: "How a real research team works: preparing messy data, designing a fair evaluation, and iterating when results don't hold up. It's where I learned that most of data science is the data.",
      results: ["83.5% accuracy on the same-room validation set", "~76–77% accuracy holding up on other rooms, other games and non-gaming streams", "Trained on 8,925 messages; tested on 185k+", "Published at IEEE AIxHeart 2024 (co-author)"],
      repo: "https://github.com/ryanli0819/asabc-bullet-chat-sentiment",
      demo: "assets/video/asabc-explainer.mp4",
      demoKind: "explainer",
      featured: true,
      title: "ASABC: an LLM arbitrator for bullet-chat sentiment",
      badge: "Published · IEEE AIxHeart 2024",
      era: "hs",
      when: "Grade 11 · Summer 2024",
      tags: ["research", "ml"],
      icon: "💬",
      summary:
        "A few-shot prompt-tuning framework that turns a pre-trained LLM into a filter for negative \"bullet chat\" messages, the comments that fly across live streams on Douyu. Trained on just one hour of chat from a single gaming room, it held about 80% accuracy on 185k+ messages from other rooms, other games and even food and shopping streams.",
      details: [
        "Came out of a summer research program with Purdue Prof. Yang's PhD team (30 hrs/week for 9 weeks).",
        "Bullet chat is hard: tiny messages full of memes and in-jokes (\"666\", \"2333\", \"FGNB\"), sarcasm and emojis like 🤡.",
        "Prompt-tuned the LLM instead of fine-tuning all of it, and used an iterative human-feedback loop to clean up rough keyword labels.",
        "Tested generalization on four much larger validation sets: same room later, other rooms, other games, and non-gaming streams."
      ],
      citation:
        "Liu, X.; Jin, N.; <b>Li, R.</b>; Li, K.; Wang, M. Y.; Yang, B. \"ASABC: An LLM-based Arbitrator for Sentiment Analysis in Bullet Chat Messages.\" IEEE AIxHeart, 2024.",
      metrics: [{ value: "~80%", label: "accuracy" }, { value: "0.90", label: "best F1" }, { value: "185k+", label: "msgs tested" }],
      skills: ["LLMs", "Few-shot prompt tuning", "Sentiment analysis", "Python", "Evaluation"],
      links: [{ label: "Research code (GitLab)", url: "https://gitlab.com/tonyyang1995/douyu" }],
      missing: [
        "Link to the paper itself (IEEE Xplore DOI or a preprint)",
        "Are you OK with co-authors being named on the site? (citation is shown as-is for now)"
      ]
    },
    {
      id: "hockey-cv",
      problem: "I spend hours on film study as a varsity left wing. Breaking down game tape by hand is slow, so I wanted software that could watch the film for me: who is on which team, who's a referee, and how fast everyone is moving.",
      time: "Grade 12 independent research · about 13 hrs/week for 7 weeks",
      learned: "Labeling ground truth is half the work, and small changes to the loss function can matter more than a bigger model. Also: computer vision is a lot harder when everyone is wearing helmets.",
      results: ["Over 90% classification accuracy", "4 classes: home team, away team, referee, puck", "Speed and distance estimated per player", "Distinction Award at IEYI China (International Exhibition for Young Inventors)"],
      repo: "https://github.com/ryanli0819/hockey-jersey-player-recognition",
      demo: "assets/video/hockey-demo.mp4",
      demoKind: "real",
      code: true,
      featured: true,
      title: "Jersey & player-role recognition",
      badge: "Distinction Award · IEYI China",
      era: "hs",
      when: "Grade 12 · Independent research",
      tags: ["ml", "cv"],
      icon: "🏒",
      summary:
        "A computer-vision system for hockey game film. A CNN identifies each player's team from jersey colors and numbers, and a fine-tuned YOLO model labels everyone on screen as player, referee, coach or other. Player movement is tracked as vectors so plays can be reviewed frame by frame.",
      details: [
        "Inspo from Raúl Vizcarra Chirinos's open-source hockey tracking project, which this builds on.",
        "Built a CNN team classifier and fine-tuned YOLOv1 to classify on-screen roles.",
        "Tracked movement in vector form, then converted rink pixels to meters to estimate player speed and distance.",
        "Used human-labeled footage as ground truth, plus linear regression and iterative loss-function tuning, to reach over 90% classification accuracy.",
        "Self-directed: about 13 hrs/week for 7 weeks in senior year."
      ],
      video: "assets/video/hockey-demo.mp4",
      metrics: [{ value: "90%+", label: "accuracy" }, { value: "4", label: "classes tracked" }],
      skills: ["PyTorch", "CNN", "YOLO", "OpenCV", "Object tracking", "Data labeling"],
      links: [{ label: "Inspo: Raúl Vizcarra Chirinos", url: "https://github.com/rvizcarra15/IceHockey_ComputerVision_PyTorch" }],
      missing: [
        "Link to YOUR code (the local repo points to a third-party GitHub repo, so it isn't linked here)",
        "Any write-up or poster from the IEYI China exhibition"
      ]
    },
    {
      id: "aviation",
      problem: "An AI system that helps student pilots learn to fly is only as good as the data it learns from. Raw exports from flight simulators need to be cleaned, structured and checked before any model can use them.",
      time: "Purdue · ongoing",
      learned: "Validation rules and repeatable pipelines beat one-off cleanup scripts, especially when someone else's model depends on your output.",
      results: ["Simulator datasets structured and validated for downstream machine learning", "Preprocessing steps built to be repeated on new exports"],
      repo: "https://github.com/ryanli0819/flight-sim-data-preprocessing",
      demo: "assets/video/aviation-explainer.mp4",
      demoKind: "explainer",
      title: "Aviation flight-data preprocessing",
      badge: "Ongoing",
      era: "college",
      when: "Purdue · Ongoing",
      tags: ["data", "research"],
      icon: "✈️",
      summary:
        "Cleaning and preprocessing data exported from Purdue's aviation flight simulators for a Bay Area company that is training an AI system to help student pilots learn to fly.",
      details: [
        "Structuring and validating simulator datasets so they're ready for downstream machine learning.",
        "Building repeatable preprocessing steps for raw flight-sim exports."
      ],
      metrics: [],
      skills: ["Python", "Data cleaning", "Data validation", "ML data prep"],
      links: [],
      missing: [
        "Is any of this shareable (repo, write-up, partner company name)? If it's under NDA, say \"details available on request\"",
        "Status update: what has progressed since this was written?"
      ]
    },
    {
      id: "datamine",
      problem: "Purdue's Data Mine pairs students with real-world datasets and partners, so the fundamentals get learned on actual problems instead of toy examples.",
      time: "Purdue · ongoing",
      learned: "SQL and data-processing fundamentals, applied to real datasets alongside faculty and industry partners.",
      results: [],
      repo: "https://github.com/ryanli0819/purdue-data-mine",
      title: "The Data Mine",
      badge: "Learning community",
      era: "college",
      when: "Purdue · Ongoing",
      tags: ["data"],
      icon: "⛏️",
      summary:
        "Purdue's Data Mine Learning Community: hands-on project work with real-world datasets alongside faculty and industry partners, building SQL and data-processing fundamentals.",
      details: [
        "Writing SQL against real datasets and building data-processing workflows."
      ],
      metrics: [],
      skills: ["SQL", "Data processing", "Teamwork"],
      links: [{ label: "About The Data Mine", url: "https://datamine.purdue.edu/" }],
      missing: [
        "Which corporate-partner project (if any) you're on",
        "Something concrete to show: a result, report or dataset"
      ]
    },
    {
      id: "kaggle",
      problem: "Kaggle's classic starter competition: given passenger details like class, sex and age, predict who survived the Titanic.",
      time: "Data science competition",
      learned: "Feature engineering on tabular data, and reading the data before reaching for a model. The chart on this card uses the real survival rates from Kaggle's training set.",
      results: ["100% accuracy on the public leaderboard", "Tied for 1st among 2,000+ entries"],
      repo: "https://github.com/ryanli0819/kaggle-titanic",
      demo: "assets/video/kaggle-explainer.mp4",
      demoKind: "explainer",
      code: true,
      title: "Kaggle Titanic: Machine Learning from Disaster",
      badge: "Tied 1st of 2,000+",
      era: "unknown",
      when: "Data science competition",
      tags: ["ml"],
      icon: "🚢",
      summary:
        "Built a machine learning model to predict which Titanic passengers survived. It scored 100% accuracy on the public leaderboard, tied for 1st among 2,000+ entries.",
      details: [],
      metrics: [{ value: "100%", label: "public LB" }, { value: "2,000+", label: "entries" }],
      skills: ["Python", "Feature engineering", "Classification"],
      links: [],
      missing: [
        "Your Kaggle username / profile link",
        "Link to the public notebook so visitors can see the approach",
        "When was this (high school or college)?"
      ]
    },
    {
      id: "drowning",
      problem: "Lifeguards can't watch every swimmer at once, and a drowning can be silent. The idea: camera software that notices when a swimmer stops moving and alerts a lifeguard.",
      time: "Grades 10–12 · about 4 hrs/week, 42 weeks a year",
      learned: "Public speaking, startup thinking, and how to size a market. A good idea still has to be explained in two minutes to people who've never heard of it.",
      results: ["2nd place in the state competition"],
      repo: "https://github.com/ryanli0819/ai-drowning-detection-pitch",
      demo: "assets/video/drowning-explainer.mp4",
      demoKind: "explainer",
      title: "AI camera for drowning detection (startup pitch)",
      badge: "2nd in state",
      era: "hs",
      when: "Grades 10–12 · Youth Entrepreneurship Service",
      tags: ["ml", "cv"],
      icon: "🛟",
      summary:
        "Through the Youth Entrepreneurship Service program, did the market analysis for and pitched AI camera software that detects drownings, earning 2nd place in the state competition.",
      details: [
        "Market analysis, business model and public pitching across three years in the program."
      ],
      metrics: [{ value: "2nd", label: "state" }],
      skills: ["Pitching", "Market analysis", "Product thinking"],
      links: [],
      missing: [
        "Product / team name and the name of the state competition",
        "Pitch deck, demo or photos you'd like to share"
      ]
    },
    {
      id: "ventrix",
      problem: "A warehouse full of AC and heating units only works if the counts are right. When the system says 64 and the shelf says 52, someone has to find out why before an order ships.",
      time: "Summer 2026 internship · May to July",
      learned: "Exploratory data analysis on a real operation, working with a sales team, and the regulations and industry standards that govern electronics and HVAC systems.",
      results: ["Daily inventory analysis across the warehouse", "Discrepancies caught with EDA to inform restocking", "Shipping orders confirmed with sales"],
      featured: true,
      wideViz: true,
      repo: "https://github.com/ryanli0819/ventrix-inventory-analysis",
      demo: "assets/video/ventrix-explainer.mp4",
      demoKind: "explainer",
      title: "Storage management intern, Ventrix Supply",
      badge: "Real-world data work",
      era: "work",
      when: "May – Jul 2026",
      tags: ["data"],
      icon: "📦",
      summary:
        "Daily inventory analysis at a warehouse for a New England distributor of TCL air-conditioning systems, using exploratory data analysis to catch stock discrepancies and inform restocking.",
      details: [
        "Tracked AC and heating unit stock and flagged discrepancies with EDA.",
        "Coordinated with sales to confirm shipping orders, and applied basic statistics to inventory counts for day-to-day decisions.",
        "Learned the government regulations and industry standards for electronics and HVAC systems."
      ],
      metrics: [],
      skills: ["EDA", "Statistics", "Inventory analysis", "Operations"],
      links: [],
      missing: []
    },
    {
      id: "vo",
      repo: "https://github.com/ryanli0819/visual-odometry",
      demo: "assets/video/vo-explainer.mp4",
      demoKind: "explainer",
      code: true,
      title: "Visual odometry",
      badge: "Details coming soon",
      era: "unknown",
      when: "TBD",
      tags: ["cv"],
      icon: "📷",
      summary:
        "A visual odometry project: estimating camera motion from a sequence of images. Full write-up coming soon.",
      details: [],
      metrics: [],
      skills: ["Computer vision"],
      links: [],
      missing: [
        "What the project was and what you built",
        "Tools used (language, libraries such as OpenCV, approach)",
        "Results or metrics",
        "GitHub link, or confirm it's private",
        "Timeframe: high school or college?"
      ]
    }
  ],

  /* ---------------------------------------------------------------
     TIMELINE (from the activities list + resume)
     --------------------------------------------------------------- */
  timeline: [
    // from/to: school year as a number (9 = Grade 9, 12.6 = summer after Grade 12, 13 = first year at Purdue).
    { from: 9, to: 9, when: "Grade 9", title: "BC Sports Management", short: "BC Sports Mgmt", kind: "learn",
      text: "Two intensive weeks (45 hrs/week) exploring sports business and analytics: marketing, ops and finance with industry professionals." },
    { from: 10, to: 12, when: "Grades 10–12", title: "Varsity Hockey, Assistant Captain", short: "Varsity Hockey", kind: "play",
      text: "Left wing. Training, film study and leading by example. Elected Varsity assistant captain." },
    { from: 10, to: 12, when: "Grades 10–12", title: "Varsity Ultimate Frisbee", short: "Ultimate Frisbee", kind: "play",
      text: "Ran the offense, competed year-round, and taught kids the game." },
    { from: 10, to: 12, when: "Grades 10–12", title: "LexMACS", short: "LexMACS", kind: "learn",
      text: "Lexington Math & CS club since sophomore year: USACO, cryptography, CTFs, physics sims." },
    { from: 10, to: 12, when: "Grades 10–12", title: "Youth Entrepreneurship Service", short: "YES startup pitch", kind: "build",
      text: "Pitched AI drowning-detection camera software. 2nd in the state competition." },
    { from: 11, to: 11, when: "Grade 11", title: "MIT AI & Art Camp", short: "MIT AI & Art", kind: "learn",
      text: "Hands-on with image-generation tools (Midjourney, DALL·E, Sora) and prompt tuning, inspired by modern museum collections." },
    { from: 11.5, to: 11.5, when: "Summer after Grade 11", title: "LLM research → IEEE paper", short: "IEEE paper", kind: "build",
      text: "Purdue Prof. Yang's PhD team, 30 hrs/week. Led to the ASABC paper at IEEE AIxHeart 2024." },
    { from: 12, to: 12, when: "Grade 12", title: "Hockey computer vision", short: "Hockey CV award", kind: "build",
      text: "Independent research. Distinction Award at IEYI China." },
    { from: 12.6, to: 12.6, when: "Summer 2026", title: "Ventrix Supply internship", short: "Ventrix internship", kind: "work",
      text: "Warehouse inventory analysis with EDA and statistics." },
    { from: 13, to: 13.6, when: "Fall 2026 →", title: "Purdue · Data Analytics", short: "Purdue", kind: "learn",
      text: "Data Mine Learning Community, plus aviation flight-data preprocessing." }
  ],

  /* ---------------------------------------------------------------
     FUN SIDE — flip cards
     --------------------------------------------------------------- */
  fun: [
    // Photos for each card go in content/fun/<folder>/ — then run: python3 tools/build_fun.py
    { folder: "hockey", icon: "🏒", title: "Left wing, assistant captain",
      front: "Lexington High Varsity Hockey",
      back: "Three varsity seasons, lots of film study, and the reason my CV project is about hockey: I wanted a computer to watch game tape the way I do." },
    { folder: "ultimate-frisbee", icon: "🥏", title: "Ultimate offense",
      front: "Varsity Ultimate Frisbee",
      back: "Ran the offense, competed year-round, and organized donations and clinics to teach kids the game." },
    { folder: "the-musket", icon: "📰", title: "Reporter",
      front: "The Musket, LHS newspaper",
      back: "Wrote about everything from school policy to scholarships: a way to tell my community's stories." },
    { folder: "chinese-american-association", icon: "🏮", title: "Culture crew",
      front: "Chinese American Association of Lexington",
      back: "Coordinated and directed cultural events with 200+ community members: instruments, choir, customs and plenty of food." },
    { folder: "lexmacs", icon: "🧩", title: "Puzzle brain",
      front: "LexMACS · USACO · CTF",
      back: "Since sophomore year: cryptography, capture-the-flag and competitive programming with friends." }
  ]
};

/* ---------------------------------------------------------------
   LIFE IN FRAMES — photos in assets/life/img/, videos in assets/life/video/
   --------------------------------------------------------------- */
// Paste a Spline "Public URL" here (Spline → Export → Public URL, starts with https://my.spline.design/) to show it
// in the "Around the world" section above the photo ring. Leave empty to show just the ring.
window.SPLINE_SCENE = "";

window.LIFE = {
  reel: [
    { src: "surf-best.mp4", cap: "🏄 Best wave of the trip, Seoul", shape: "wide" },
    { src: "hockey-goal-1.mp4", cap: "🏒 Goal", shape: "wide" },
    { src: "golf-driver-280.mp4", cap: "⛳ 280-yard drive in China", shape: "tall" },
    { src: "surf-wave.mp4", cap: "🌊 Riding one in Seoul", shape: "wide" },
    { src: "hockey-goal-2.mp4", cap: "🏒 Another goal", shape: "wide" },
    { src: "tennis-serve.mp4", cap: "🎾 Serve", shape: "tall" },
    { src: "golf-swing.mp4", cap: "⛳ Golf swing", shape: "tall" },
    { src: "hockey-goal-3.mp4", cap: "🏒 Goal again", shape: "wide" },
    { src: "golf-range.mp4", cap: "⛳ At the range", shape: "tall" },
    { src: "wakesurf-sunset.mp4", cap: "🌅 Wakesurfing at sunset", shape: "wide" },
    { src: "ski-run.mp4", cap: "⛷️ Ski run", shape: "wide" },
    { src: "hockey-game.mp4", cap: "🏒 Game day", shape: "wide" }
  ],
  hockey: [
    ["hockey-shot", "Shot from the slot"], ["hockey-back-19", "#19"], ["hockey-anthem", "National anthem"],
    ["hockey-lexington", "Lexington vs. the boards"], ["hockey-laugh", "Genuine laugh"], ["hockey-carry", "Carrying it in"],
    ["hockey-big-hit", "Big hit"], ["hockey-bond", "Bench bond"], ["hockey-skate", "Wheels"],
    ["hockey-boys", "With the boys"], ["hockey-chase", "Puck chase"], ["hockey-pose", "Pose"],
    ["hockey-rush", "Odd-man rush"], ["hockey-battle", "Battle at the net"], ["hockey-bench", "Goal celebration"],
    ["hockey-phone-case", "My phone case. Yes, it's me."]
  ],
  world: [
    ["japan-torii", "Torii gates, Japan"], ["surf-barrel", "Surfing in Seoul"], ["china-hohhot-horses", "Horse riding in Hohhot, China"],
    ["ski-copper", "Skiing at Copper Mountain"], ["seoul-brother", "With my brother in Seoul"], ["surf-young", "Surfing, younger me"],
    ["japan-nature", "Japan, up in the green"], ["world-cup-flag", "Flag bearer at the Boston World Cup. Best experience."],
    ["surf-seoul", "Seoul wave pool"], ["china-horse", "Out on the grassland, Hohhot"], ["surf-long-island", "Long Island surf"],
    ["space-saturn-v", "Under a Saturn V rocket"], ["space-patches", "Apollo mission patches"], ["moon-night", "Moon over the water"]
  ],
  eats: [
    ["eats-ramen", "Ramen"], ["eats-wagyu", "Wagyu sukiyaki"], ["eats-malatang", "Malatang"], ["eats-matcha", "Matcha"],
    ["eats-japan-hamburg", "Hamburg steak, Japan"], ["eats-truffle-burger", "Truffle burger"], ["eats-canto", "Cantonese"],
    ["eats-chinese", "Spicy Chinese"], ["eats-purdue", "Purdue dining"],
    ["eats-steak", "Steak with chimichurri"], ["eats-kbbq", "Korean BBQ"], ["eats-desserts", "Dessert round"], ["eats-seafood-tower", "Seafood tower"],
    ["eats-hotpot", "Hot pot"], ["eats-spicy-stirfry", "Spicy stir-fry"], ["eats-feast", "Family-style feast"], ["eats-prosciutto-pizza", "Prosciutto pizza"],
    ["eats-white-pizza", "White pizza"], ["eats-pasta", "Pasta with egg yolk"], ["eats-shrimp", "Shrimp night"], ["eats-breakfast", "Breakfast plate"],
    ["eats-steak-dinner", "Steak dinner"], ["eats-lobster-roll", "Lobster roll"], ["eats-shabu", "Shabu-shabu"], ["eats-spread", "The spread"]
  ],
  people: [
    ["frisbee-sunset", "Frisbee boys at sunset"], ["prom", "Prom"], ["pastrnak", "With David Pastrňák"],
    ["frisbee-nationals", "Frisbee nationals"], ["boba-job", "Working at the boba place"], ["frisbee-team", "Frisbee team"],
    ["prom-bus", "Prom bus"], ["frisbee-squad", "The squad"], ["frisbee-yula", "Fall frisbee crew"],
    ["big-bite", "Big bite"], ["seafood-boil", "Seafood boil"], ["food-tray", "Dessert haul"]
  ]
};
