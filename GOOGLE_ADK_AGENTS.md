# Google ADK Agents Reference

A curated collection of agents from the [google/adk-samples](https://github.com/google/adk-samples/tree/main/python/agents) repository.

---

## 🎯 High-Value / Versatile Agents

| Agent | Type | Use Case |
|-------|------|----------|
| [deep-search](python/agents/deep-search) | Multi-agent | Blueprint for sophisticated fullstack research agent with Gemini. Complex agentic workflows, modular agents, Human-in-the-Loop (HITL). |
| [data-science](python/agents/data-science) | Multi-agent | Sophisticated data analysis. NL2SQL, structured data, database integration. |
| [financial-advisor](python/agents/financial-advisor) | Multi-agent | Risk analysis, strategy generation, summarization, report generation. Educational for finance/investments. |
| [travel-concierge](python/agents/travel-concierge) | Multi-agent | Travel planning, booking, itinerary management. Advanced conversational. |
| [marketing-agency](python/agents/marketing-agency) | Multi-agent | Domain identification, website generation, marketing strategy, brand assets. |
| [software-bug-assistant](python/agents/software-bug-assistant) | Single-agent | Bug resolution using RAG, MCP, bug tracking, GitHub/StackOverflow/Google Search integration. |
| [llm-auditor](python/agents/llm-auditor) | Multi-agent | Chatbot response verification, content auditing. |
| [youtube-analyst](python/agents/youtube-analyst) | Multi-agent | YouTube content analysis, channel performance, audience engagement with Plotly charts. |

---

## 🏥 Healthcare / Medical

| Agent | Type | Use Case |
|-------|------|----------|
| [medical-pre-authorization](python/agents/medical-pre-authorization) | Multi-agent | Automates pre-authorization by analyzing medical records and health policies. |
| [nurse-handover](python/agents/nurse-handover) | Multi-agent | Nurse handover, shift scheduling, roster management. |

---

## 💰 Financial Services

| Agent | Type | Use Case |
|-------|------|----------|
| [currency-agent](python/agents/currency-agent) | Single-agent | Currency exchange rate lookups and conversions. |
| [data-engineering](python/agents/data-engineering) | Single-agent | BigQuery and Dataform pipelines, ELT, data modeling. |
| [fomc-research](python/agents/fomc-research) | Multi-agent | Market event analysis, FOMC research. |
| [auto-insurance-agent](python/agents/auto-insurance-agent) | Multi-agent | Auto insurance: members, claims, rewards, roadside assistance. |
| [small-business-loan-agent](python/agents/small-business-loan-agent) | Multi-agent | Loan processing, underwriting, pricing. |
| [antom-payment](python/agents/antom-payment) | Single-agent | Payment and refund operations via MCP. |

---

## 🛒 E-Commerce / Retail

| Agent | Type | Use Case |
|-------|------|----------|
| [brand-search-optimization](python/agents/brand-search-optimization) | Multi-agent | E-commerce product data enrichment, search optimization. |
| [personalized-shopping](python/agents/personalized-shopping) | Single-agent | Product recommendations, shopping assistant. |
| [customer-service](python/agents/customer-service) | Single-agent | Customer service, product selection, order management. Advanced. |

---

## 📊 Data & Analytics

| Agent | Type | Use Case |
|-------|------|----------|
| [RAG](python/agents/RAG) | Single-agent | Vertex AI RAG Engine for document Q&A with citations. |
| [google-trends-agent](python/agents/google-trends-agent) | Sequential | Trending search trends from Google Trends via BigQuery. |
| [plumber-data-engineering-assistant](python/agents/plumber-data-engineering-assistant) | Multi-agent | Big data pipelines: Spark, Beam, dBT on GCP. |

---

## 🔧 Development / Engineering

| Agent | Type | Use Case |
|-------|------|----------|
| [agent-skills-tutorial](python/agents/agent-skills-tutorial) | Single-agent | Tutorial: 4 ADK skill patterns (inline, file-based, external, meta). |
| [safety-plugins](python/agents/safety-plugins) | Plugin | Safety filter plugins: Gemini as judge, Model Armor. |
| [sdlc-task-planner](python/agents/sdlc-task-planner) | Multi-agent | SDLC task planning. |
| [sdlc-technical-designer](python/agents/sdlc-technical-designer) | Multi-agent | SDLC technical design. |
| [sdlc-user-story-refiner](python/agents/sdlc-user-story-refiner) | Multi-agent | SDLC user story refinement. |
| [incident-management](python/agents/incident-management) | Single-agent | ServiceNow integration, identity propagation. |

---

## 🎬 Media / Creative

| Agent | Type | Use Case |
|-------|------|----------|
| [short-movie-agents](python/agents/short-movie-agents) | Multi-agent | End-to-end video generation from user intent. |
| [blog-writer](python/agents/blog-writer) | Multi-agent | Blog content generation with research. |
| [brand-aligner](python/agents/brand-aligner) | Multi-agent | Brand alignment for presentations and media. |

---

## 🔐 Security / Compliance

| Agent | Type | Use Case |
|-------|------|----------|
| [cyber-guardian-agent](python/agents/cyber-guardian-agent) | Multi-agent | Security threat analysis, investigation, response. |
| [ai-security-agent](python/agents/ai-security-agent) | Multi-agent | AI security assessment and monitoring. |
| [policy-as-code](python/agents/policy-as-code) | Single-agent | Policy enforcement as code. |
| [global-kyc-agent](python/agents/global-kyc-agent) | Multi-agent | Global KYC (Know Your Customer). |

---

## 📋 Workflow Patterns

| Pattern | Agent | Description |
|---------|-------|-------------|
| Sequential | [hierarchical-workflow-automation](python/agents/hierarchical-workflow-automation) | Multi-level task execution across systems. |
| Concurrent | [parallel_task_decomposition_execution](python/agents/parallel_task_decomposition_execution) | Parallel task execution. |
| Human-in-Loop | [workflows-HITL_concierge](python/agents/workflows-HITL_concierge) | Workflow with human approval steps. |
| Multi-agent | [supply-chain](python/agents/supply-chain) | Supply chain optimization with real-time analysis. |

---

## 🧪 Experimental / Research

| Agent | Type | Use Case |
|-------|------|----------|
| [academic-research](python/agents/academic-research) | Multi-agent | Research publication discovery. |
| [deep-research](python/agents/deep-research) | Multi-agent | Deep research workflows. |
| [gemma-food-tour-guide](python/agents/gemma-food-tour-guide) | Single-agent | Food tour guide with Google Maps MCP + multimodal. |
| [swe-benchmark-agent](python/agents/swe-benchmark-agent) | Single-agent | Software engineering benchmark tasks. |

---

## 📁 Quick Access

To use any agent, clone the repo and navigate to:

```
https://github.com/google/adk-samples/tree/main/python/agents/[AGENT_NAME]
```

Common dependencies to install:
- `google-adk`
- `google-genai`
- `pytest` (for eval)

---

*Last updated: April 10, 2026*