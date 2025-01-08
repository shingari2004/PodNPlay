"use client";

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import PodcastCard from '@/components/PodcastCard';
import EmptyState from '@/components/EmptyState';
import LoaderSpinner from '@/components/LoaderSpinner';

interface DiscoverProps {
  search: string;
}

export default function Discover({ search }: DiscoverProps) {
  const podcasts = useQuery(api.podcasts.getPodcastBySearch, { 
    search 
  });

  if (!podcasts) return <LoaderSpinner />;

  return (
    <section className="flex w-full flex-col gap-8">
      <h1 className="text-20 font-bold text-white-1">
        {search ? `Search results for "${search}"` : "Discover Podcasts"}
      </h1>

      {podcasts.length > 0 ? (
        <div className="podcast_grid">
          {podcasts.map(({ _id, podcastTitle, podcastDescription, imageUrl }) => (
            <PodcastCard 
              key={_id}
              imgUrl={imageUrl as string}
              title={podcastTitle}
              description={podcastDescription}
              podcastId={_id}
            />
          ))}
        </div>
      ) : (
        <EmptyState 
          title={search ? "No podcasts found" : "No podcasts available"}
          description={search ? "Try searching with different keywords" : "Be the first to create a podcast"}
          buttonLink="/create"
          buttonText="Create a podcast"
        />
      )}
    </section>
  );
}