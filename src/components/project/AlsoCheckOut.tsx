import React from "react";
import clsx from "clsx";

type Project = {
  id: string;
  title: string;
  year: string;
  description: string;
  imageSrc: string;
};

type ProjectCardProps = {
  project: Project;
  className?: string;
  onClick?: () => void;
};

function ProjectCard({ project, className, onClick }: ProjectCardProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick?.();
      }}
      className={clsx(
        "content-stretch flex flex-col gap-3 items-start relative shrink-0 cursor-pointer group text-left z-10",
        className
      )}
    >
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-xl shrink-0 w-full transition-transform duration-300 group-hover:scale-[0.99]">
        <div className="aspect-[678/367.625] relative rounded-xl shrink-0 w-full">
          <img
            className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-xl size-full"
            alt=""
            src={project.imageSrc}
          />
        </div>
      </div>
      <div className="content-stretch flex flex-col font-medium items-start leading-[1.4] px-[13px] py-0 relative shrink-0 text-base whitespace-pre-wrap">
        <p className="relative shrink-0 text-[#111827] w-full">
          <span>{project.title}</span>
          <span className="text-[#9ca3af]"> • {project.year}</span>
        </p>
        <p className="relative shrink-0 text-[#9ca3af] w-full font-normal">
          {project.description}
        </p>
      </div>
    </button>
  );
}

type AlsoCheckOutProps = {
  device?: "Default" | "Mobile";
  /** Projects to display */
  projects: Project[];
  /** Callback when "View all projects" is clicked */
  onViewAll?: () => void;
  /** Callback when a project card is clicked */
  onProjectClick?: (project: Project) => void;
};

export default function AlsoCheckOut({
  device = "Default",
  projects,
  onViewAll,
  onProjectClick,
}: AlsoCheckOutProps) {
  const isDesktop = device === "Default";
  const isMobile = device === "Mobile";

  // Only show up to 2 projects
  const displayProjects = projects.slice(0, 2);

  return (
    <div
      className={clsx(
        "content-stretch flex flex-col gap-16 items-start justify-center py-16 relative",
        isDesktop && "px-[175px] w-[1440px]",
        isMobile && "px-8 w-[640px]"
      )}
    >
      <div className="content-stretch flex flex-col gap-8 items-start relative shrink-0 w-full">
        {/* Section Title */}
        <p className="font-normal leading-7 relative shrink-0 text-[#6b7280] text-xl w-full whitespace-pre-wrap">
          Also check out...
        </p>

        {/* Projects Grid */}
        <div
          className={clsx(
            "content-stretch flex gap-4 relative shrink-0 w-full",
            isDesktop && "items-center",
            isMobile && "flex-col items-start justify-center"
          )}
        >
          {displayProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onProjectClick?.(project)}
              className={clsx(
                isDesktop && "flex-[1_0_0] min-h-px min-w-px",
                isMobile && "w-full"
              )}
            />
          ))}
        </div>
      </div>

      {/* View All Button */}
      <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewAll?.();
          }}
          className="bg-[#f9fafb] border border-[#e5e7eb] border-solid content-stretch flex items-center justify-center px-5 py-2.5 relative rounded-full shrink-0 hover:bg-[#f3f4f6] transition-colors cursor-pointer z-10"
        >
          <span className="font-semibold leading-normal relative shrink-0 text-[#4b5563] text-base tracking-[0.16px]">
            View all projects
          </span>
        </button>
      </div>
    </div>
  );
}
