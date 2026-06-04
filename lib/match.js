// PathFinder matching engine: taxonomy-based skill extraction + course/journey scoring.
const SYNONYMS = {
  "machine learning": "Machine Learning", "ml ": "Machine Learning", "deep learning": "Deep Learning",
  "artificial intelligence": "Generative AI", "genai": "Generative AI", "gen ai": "Generative AI",
  "generative ai": "Generative AI", "llm": "Large Language Models", "llms": "Large Language Models",
  "large language model": "Large Language Models", "nlp": "Natural Language Processing",
  "natural language processing": "Natural Language Processing", "prompt": "Prompt Engineering",
  "rag": "RAG Pipelines", "retrieval augmented": "RAG Pipelines", "vector database": "Vector Databases",
  "agents": "AI Agents", "agentic": "AI Agents", "ai agent": "AI Agents",
  "fine-tuning": "Fine-Tuning", "fine tuning": "Fine-Tuning", "mlops": "MLOps",
  "ci/cd": "CI/CD Pipelines", "cicd": "CI/CD Pipelines", "kubernetes": "Kubernetes", "k8s": "Kubernetes",
  "docker": "Docker", "aws": "AWS", "azure": "Azure", "gcp": "Google Cloud Platform",
  "google cloud": "Google Cloud Platform", "sql": "SQL", "python": "Python", "java ": "Java",
  "javascript": "JavaScript", "typescript": "JavaScript", "react": "React", "angular": "Angular",
  "node": "Node.js", "rest api": "REST API Development", "apis": "API Integration",
  "microservices": "Microservices Architecture", "data pipeline": "Data Pipelines",
  "etl": "Data Pipelines", "data warehouse": "Data Warehousing", "snowflake": "Snowflake",
  "databricks": "Databricks", "spark": "Apache Spark", "kafka": "Apache Kafka",
  "tableau": "Tableau", "power bi": "Power BI", "excel": "Microsoft Excel",
  "data visualization": "Data Visualization", "data visualisation": "Data Visualization",
  "statistics": "Statistical Analysis", "statistical": "Statistical Analysis",
  "a/b test": "A/B Testing", "seo": "SEO", "google analytics": "Google Analytics 4",
  "ga4": "Google Analytics 4", "email marketing": "Email Marketing", "branding": "Brand Strategy",
  "brand": "Brand Strategy", "social media": "Social Media Management",
  "content marketing": "Content Marketing", "scrum": "Scrum", "agile": "Agile Methodology",
  "product management": "Product Management", "product strategy": "Product Strategy",
  "user stories": "User Story Writing", "roadmap": "Product Roadmapping",
  "stakeholder": "Stakeholder Management", "communication": "Communication Skills",
  "leadership": "Leadership", "project management": "Project Management",
  "financial model": "Financial Modeling", "valuation": "Equity Valuation",
  "portfolio": "Portfolio Management", "risk management": "Risk Management",
  "forecasting": "Forecasting", "time series": "Time Series Analysis",
  "fraud": "Anomaly Detection", "anomaly": "Anomaly Detection",
  "cybersecurity": "Cybersecurity", "penetration testing": "Penetration Testing",
  "pentest": "Penetration Testing", "siem": "SIEM", "cryptography": "Cryptography",
  "compliance": "Regulatory Compliance", "governance": "AI Governance", "audit": "Audit Management",
  "recruitment": "Talent Acquisition", "hiring": "Talent Acquisition", "hr ": "Human Resource Management",
  "supply chain": "Supply Chain Management", "logistics": "Supply Chain Management",
  "inventory": "Inventory Management", "manufacturing": "Industry 4.0",
  "predictive maintenance": "Predictive Maintenance", "iot": "Industry 4.0",
  "automation": "Workflow Automation", "zapier": "Zapier", "n8n": "N8N", "no-code": "No-Code Development",
  "no code": "No-Code Development", "chatbot": "Chatbot Development", "conversational": "Conversation Design",
  "ux": "UX Design", "usability": "Usability Testing", "figma": "UI Design", "canva": "Canva",
  "transformers": "Transformer Architecture", "hugging face": "Hugging Face", "huggingface": "Hugging Face",
  "pytorch": "PyTorch", "tensorflow": "TensorFlow", "langchain": "LangChain", "langgraph": "LangGraph",
  "crewai": "Multi-Agent Systems", "multi-agent": "Multi-Agent Systems", "openai": "OpenAI API",
  "computer vision": "Computer Vision", "image generation": "AI Image Generation",
  "stable diffusion": "Stable Diffusion", "git": "Git", "github": "GitHub", "testing": "Software Testing",
  "selenium": "Test Automation", "qa ": "Quality Assurance", "spring boot": "Spring Boot",
  "django": "Python", "fastapi": "FastAPI", "graphql": "GraphQL", "mongodb": "MongoDB",
  "postgres": "SQL", "mysql": "SQL", "blockchain": "Blockchain", "web3": "Web3",
  "sap": "SAP ABAP", "salesforce": "Salesforce", "vmware": "VMware vSphere", "ansible": "Ansible",
  "terraform": "Infrastructure as Code", "devops": "DevOps", "devsecops": "DevSecOps",
  "finops": "Cloud FinOps", "data governance": "Data Governance", "data quality": "Data Quality",
  "annotation": "Data Annotation", "labeling": "Data Annotation", "rlhf": "RLHF",
};

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export function extractSkills(text, taxonomy) {
  const lower = " " + text.toLowerCase().replace(/[\n\r\t,;:()\/]+/g, " ") + " ";
  const found = new Map();
  for (const [syn, canon] of Object.entries(SYNONYMS)) {
    if (lower.includes(syn.endsWith(" ") ? " " + syn : syn)) {
      found.set(canon, (found.get(canon) || 0) + 2);
    }
  }
  for (const sk of taxonomy) {
    const name = sk.name.toLowerCase();
    if (name.length < 4) continue;
    if (lower.includes(name)) {
      const re = new RegExp("(^|[^a-z0-9])" + escapeRe(name) + "($|[^a-z0-9])");
      if (re.test(lower)) found.set(sk.name, (found.get(sk.name) || 0) + 1 + Math.min(3, 200 / (sk.count + 10)));
    }
  }
  return [...found.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

export function scoreCourses(skills, courses, limit = 12) {
  const set = new Set(skills.map((s) => s.toLowerCase()));
  return courses
    .map((c) => {
      const hits = c.skills.filter((s) => set.has(s.toLowerCase()));
      return { ...c, hits, score: hits.length / Math.sqrt(c.skills.length || 1) };
    })
    .filter((c) => c.hits.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function scoreJourneys(skills, journeys, limit = 3) {
  const set = new Set(skills.map((s) => s.toLowerCase()));
  return journeys
    .map((j) => {
      const hits = j.skills.filter((s) => set.has(s.toLowerCase()));
      return { slug: j.slug, role: j.role, weeks: j.weeks, level: j.level, readiness: j.readiness, hits, score: hits.length };
    })
    .filter((j) => j.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function analyzeJD(text, taxonomy, courses, journeys) {
  const skills = extractSkills(text, taxonomy);
  const matchedCourses = scoreCourses(skills, courses);
  const matchedJourneys = scoreJourneys(skills, journeys);
  const allCourseSkills = new Set();
  for (const c of courses) for (const s of c.skills) allCourseSkills.add(s.toLowerCase());
  const covered = skills.filter((s) => allCourseSkills.has(s.toLowerCase()));
  return {
    skills, covered, gaps: skills.filter((s) => !allCourseSkills.has(s.toLowerCase())),
    coverage: skills.length ? Math.round((covered.length / skills.length) * 100) : 0,
    courses: matchedCourses, journeys: matchedJourneys,
  };
}

function titleTokens(s) {
  return new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3));
}

export function analyzeCurriculum(text, taxonomy, courses) {
  const lines = text.split(/\n+/).map((l) => l.replace(/^[\d\.\-\*•)\s]+/, "").trim()).filter((l) => l.length > 2);
  const courseTok = courses.map((c) => ({ c, tok: titleTokens(c.title) }));
  const subjects = lines.slice(0, 80).map((line) => {
    const skills = extractSkills(line, taxonomy).slice(0, 6);
    const lineTok = titleTokens(line);
    let best = null, bestScore = 0;
    for (const { c, tok } of courseTok) {
      let inter = 0;
      for (const w of lineTok) if (tok.has(w)) inter++;
      const score = inter / Math.max(2, Math.min(lineTok.size, tok.size));
      if (score > bestScore) { bestScore = score; best = c; }
    }
    const skillSet = new Set(skills.map((s) => s.toLowerCase()));
    let skillCourse = null, skillHits = 0;
    if (skills.length) {
      for (const c of courses) {
        const hits = c.skills.filter((s) => skillSet.has(s.toLowerCase())).length;
        if (hits > skillHits) { skillHits = hits; skillCourse = c; }
      }
    }
    let status, mapped;
    if (bestScore >= 0.45 || skillHits >= 3) { status = "Full"; mapped = bestScore >= 0.45 ? best : skillCourse; }
    else if (bestScore >= 0.22 || skillHits >= 1) { status = "Partial"; mapped = bestScore >= 0.22 && best ? best : skillCourse; }
    else { status = "Gap"; mapped = null; }
    return { subject: line.slice(0, 120), skills, status, mapped: mapped ? mapped.title : null, mappedSlug: mapped ? mapped.slug : null };
  });
  const full = subjects.filter((s) => s.status === "Full").length;
  const partial = subjects.filter((s) => s.status === "Partial").length;
  const coverage = subjects.length ? Math.round(((full + partial * 0.5) / subjects.length) * 100) : 0;
  return { subjects, coverage, full, partial, gaps: subjects.length - full - partial };
}
