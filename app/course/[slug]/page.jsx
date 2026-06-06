import courses from "../../../data/courses.json";
import CourseDetail from "./CourseDetail";

export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }));
}
export function generateMetadata({ params }) {
  const c = courses.find((x) => x.slug === params.slug);
  return { title: `${c ? c.title : "Course"} — InfyAI` };
}

export default function CoursePage({ params }) {
  const course = courses.find((x) => x.slug === params.slug);
  if (!course) return <p>Not found.</p>;
  return <CourseDetail course={course} />;
}
