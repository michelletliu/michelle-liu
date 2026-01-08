import React from "react";
import clsx from "clsx";
import ViewAllProjectsButton from "./ViewAllProjectsButton";

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
        "flex flex-col gap-3 items-start cursor-pointer group text-left w-full",
        className
      )}
    >
      <div className="w-full overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-[0.99]">
        <div className="aspect-[678/368] w-full relative">
          <img
            className="absolute inset-0 object-cover rounded-xl w-full h-full"
            alt=""
            src={project.imageSrc}
          />
        </div>
      </div>
      <div className="flex flex-col font-medium items-start px-2 gap-2 sm:px-[13px] text-sm sm:text-base w-full">
        <p className="text-[#111827] text-base">
          <span>{project.title}</span>
          <span className="text-[#9ca3af] text-base"> • {project.year}</span>
        </p>
        <p className="text-[#9ca3af] font-normal leading-none opacity-0 translate-y-1 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0">
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
  // Only show up to 2 projects
  const displayProjects = projects.slice(0, 2);

  return (
    <div className="flex flex-col items-start justify-center py-10 sm:py-16 px-6 sm:px-8 md:px-12 lg:px-[175px] w-full max-w-[1440px] mx-auto">
      <div className="flex flex-col gap-8 sm:gap-10 items-start w-full mb-10 sm:mb-16">
        {/* Section Title */}
        <p className="font-normal leading-7 text-[#6b7280] text-lg sm:text-xl">
          Also check out...
        </p>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-6 w-full">
          {displayProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onProjectClick?.(project)}
              className="w-full"
            />
          ))}
        </div>
      </div>

      {/* View All Button */}
      <ViewAllProjectsButton onClick={onViewAll} />
    </div>
  );
}

