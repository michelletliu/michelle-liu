import { useState, useEffect } from 'react';
import { client } from '../sanity/client';
import { EXPERIMENT_PROJECT_BY_ID_QUERY } from '../sanity/queries';
import type { ToolCategory } from '../components/InfoButton';

// Type for the Sanity experiment project data
export type ExperimentProjectData = {
  _id: string;
  projectId: string;
  title: string;
  year: string;
  description: string;
  muxPlaybackId?: string;
  xLink?: string;
  tryItOutHref?: string;
  toolCategories?: ToolCategory[];
};

// Type for the transformed project info (used by InfoButton)
export type ProjectInfo = {
  id: string;
  title: string;
  year: string;
  description: string;
  imageSrc: string;
  videoSrc?: string;
  xLink?: string;
  tryItOutHref: string;
  toolCategories?: ToolCategory[];
};

// Helper to generate Mux URLs from playback ID
function getMuxUrls(playbackId: string) {
  return {
    imageSrc: `https://image.mux.com/${playbackId}/thumbnail.png`,
    videoSrc: `https://stream.mux.com/${playbackId}.m3u8`,
  };
}

/**
 * Hook to fetch experiment project data from Sanity
 * Falls back to provided default data if Sanity fetch fails
 */
export function useExperimentProject(
  projectId: string,
  defaultProject: ProjectInfo
): ProjectInfo {
  const [project, setProject] = useState<ProjectInfo>(defaultProject);

  useEffect(() => {
    async function fetchProject() {
      try {
        const data = await client.fetch<ExperimentProjectData>(
          EXPERIMENT_PROJECT_BY_ID_QUERY,
          { projectId }
        );

        if (data) {
          const muxUrls = data.muxPlaybackId
            ? getMuxUrls(data.muxPlaybackId)
            : { imageSrc: defaultProject.imageSrc, videoSrc: defaultProject.videoSrc };

          setProject({
            id: data.projectId,
            title: data.title,
            year: data.year,
            description: data.description,
            imageSrc: muxUrls.imageSrc,
            videoSrc: muxUrls.videoSrc,
            xLink: data.xLink || defaultProject.xLink,
            tryItOutHref: data.tryItOutHref || defaultProject.tryItOutHref,
            toolCategories: data.toolCategories || defaultProject.toolCategories,
          });
        }
      } catch (error) {
        console.error(`Error fetching experiment project ${projectId}:`, error);
        // Keep default project on error
      }
    }

    fetchProject();
  }, [projectId, defaultProject]);

  return project;
}
