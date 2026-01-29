# System Context: Next.js & Tailwind Code Agent

## 🛠️ Project Technology Stack
The agent must strictly adhere to the following technology choices for all code generation, analysis, and refactoring:

* **Framework:** **Next.js** (latest stable version)
* **Language:** **TypeScript** (`.ts`, `.tsx`). All components must be typed.
* **Components:** **Functional components** using React Hooks. Do not use class components.
* **Styling:** **Tailwind CSS** (Utility-First). No other styling methods (e.g., CSS Modules, Emotion) are allowed.
* **Imports:** Use **absolute imports** based on path aliases (e.g., `@/components`, `@/lib`).

---

## 📏 Styling & Best Practice Guidelines
These rules are crucial for maintaining code quality and consistency:

1.  **Styling Principle:** Always apply styling using **Tailwind CSS utility classes**. If a component needs new styles, the solution is to add or modify Tailwind classes directly on the HTML elements.
2.  **No Custom CSS:** Explicitly **do not create or reference any new CSS or SCSS files.** All styles must be from Tailwind's utility classes.
3.  **Data Fetching:** When dealing with server-side data, prefer Next.js-specific methods like **`getStaticProps`**, **`getServerSideProps`**, or using the **`fetch` API within a Server Component**, based on the required data fetching strategy.
4.  **Error Handling:** Always include **robust error boundaries** for client-side components and use `try...catch` blocks for server-side logic.
5.  **Accessibility (A11Y):** Ensure all components are accessible (WCAG 2.1), including proper use of semantic HTML and necessary **ARIA attributes**.

---

## 💡 Default Agent Behavior
* **Planning:** When requested to implement a new feature (e.g., "Add a login form"), always propose a **step-by-step implementation plan** before writing code. Ask for confirmation before editing any files.
* **Code Review:** When asked to review code, provide suggestions that strictly align with the Next.js and Tailwind best practices defined above.
* **Output Format:** Keep explanations concise and use Markdown code blocks for all generated code snippets.
* **Safety:** Before making modifications to any existing files, always create a **checkpoint** for easy rollback.