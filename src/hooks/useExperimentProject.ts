import React, { useState, useEffect } from 'react';
import { client, urlFor } from '../sanity/client';
import { EXPERIMENT_PROJECT_BY_ID_QUERY } from '../sanity/queries';
import type { ToolCategory } from '../components/shared/InfoButton';
import { muxPosterUrl, posterTimeForProject } from '../lib/muxPoster';
import type { SanityImage } from '../sanity/types';

// Type for the Sanity experiment project data
export type ExperimentProjectData = {
  _id: string;
  projectId: string;
  title: string;
  year: string;
  description: string;
  muxPlaybackIdClip?: string;
  muxPlaybackId?: string;
  fallbackThumbnail?: SanityImage;
  xLink?: string;
  tryItOutHref?: string;
  backgroundColor?: string;
  toolCategories?: ToolCategory[];
};

// Type for the transformed project info (used by InfoButton)
export type ProjectInfo = {
  id: string;
  title: string;
  year: string;
  description: React.ReactNode;
  imageSrc: string;
  videoSrc?: string;
  xLink?: string;
  tryItOutHref: string;
  backgroundColor?: string;
  toolCategories?: ToolCategory[];
};

// Helper to generate Mux URLs from playback ID
function getMuxUrls(playbackId: string, projectId?: string) {
  return {
    imageSrc: muxPosterUrl(playbackId, { projectId }),
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
            ? getMuxUrls(data.muxPlaybackId, data.projectId)
            : { imageSrc: defaultProject.imageSrc, videoSrc: defaultProject.videoSrc };

          const fallbackUrl = data.fallbackThumbnail
            ? urlFor(data.fallbackThumbnail).width(1920).url()
            : undefined;
          const imageSrc =
            posterTimeForProject(data.projectId) !== undefined
              ? muxUrls.imageSrc
              : fallbackUrl || muxUrls.imageSrc;

          setProject({
            id: data.projectId,
            title: data.title,
            year: data.year,
            description: typeof defaultProject.description !== 'string' ? defaultProject.description : data.description,
            imageSrc,
            videoSrc: muxUrls.videoSrc,
            xLink: data.xLink || defaultProject.xLink,
            tryItOutHref: data.tryItOutHref || defaultProject.tryItOutHref,
            backgroundColor: data.backgroundColor || defaultProject.backgroundColor,
            toolCategories: data.toolCategories || defaultProject.toolCategories,
          });
        }
      } catch {
        // Sanity fetch failed — keep default project data
      }
    }

    fetchProject();
  }, [projectId, defaultProject]);

  return project;
}
