import { GeneratePodcastProps } from "@/types";
import React, { useState } from "react";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader, Upload } from "lucide-react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/components/ui/use-toast";
import { useUploadFiles } from "@xixixao/uploadstuff/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const useGeneratePodcast = ({
  setAudio,
  voiceType,
  voicePrompt,
  setAudioStorageId,
}: GeneratePodcastProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const { startUpload } = useUploadFiles(generateUploadUrl);

  const getPodcastAudio = useAction(api.openai.generateAudioAction);

  const getAudioUrl = useMutation(api.podcasts.getUrl);

  const generatePodcast = async () => {
    setIsGenerating(true);
    setAudio("");

    if (!voicePrompt) {
      toast({
        title: "Please provide a voiceType to generate a podcast",
      });
      return setIsGenerating(false);
    }

    try {
      const response = await getPodcastAudio({
        voice: voiceType,
        input: voicePrompt,
      });

      const blob = new Blob([response], { type: "audio/mpeg" });
      const fileName = `podcast-${uuidv4()}.mp3`;
      const file = new File([blob], fileName, { type: "audio/mpeg" });

      const uploaded = await startUpload([file]);
      const storageId = (uploaded[0].response as any).storageId;

      setAudioStorageId(storageId);

      const audioUrl = await getAudioUrl({ storageId });
      setAudio(audioUrl!);
      setIsGenerating(false);
      toast({
        title: "Podcast generated successfully",
      });
    } catch (error) {
      console.log("Error generating podcast", error);
      toast({
        title: "Error creating a podcast",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  return { isGenerating, generatePodcast };
};

interface CreatePodcastProps extends GeneratePodcastProps {
  onUpload?: (url: string, storageId: string, duration: number) => void;
}

const useAudioUpload = ({
  setAudio,
  setAudioStorageId,
  setAudioDuration,
}: Pick<
  GeneratePodcastProps,
  "setAudio" | "setAudioStorageId" | "setAudioDuration"
>) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const { startUpload } = useUploadFiles(generateUploadUrl);
  const getAudioUrl = useMutation(api.podcasts.getUrl);

  const uploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const files = e.target.files;
      if (!files) return;

      const file = files[0];
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Please upload an audio file",
          variant: "destructive",
        });
        return;
      }

      const uploaded = await startUpload([file]);
      const storageId = (uploaded[0].response as any).storageId;

      setAudioStorageId(storageId);
      const audioUrl = await getAudioUrl({ storageId });
      setAudio(audioUrl!);

      // Create temporary audio element to get duration
      const audio = new Audio(audioUrl);
      audio.addEventListener("loadedmetadata", () => {
        setAudioDuration(audio.duration);
      });

      toast({
        title: "Audio uploaded successfully",
      });
    } catch (error) {
      console.log("Error uploading audio", error);
      toast({
        title: "Error uploading audio",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadAudio };
};

const CreatePodcast = (props: CreatePodcastProps) => {
  const { isGenerating, generatePodcast } = useGeneratePodcast(props);
  const { isUploading, uploadAudio } = useAudioUpload(props);
  const [isAiPodcast, setIsAiPodcast] = useState(false);

  return (
    <>
      <div className="generate_thumbnail mb-5">
        <Button
          type="button"
          variant="plain"
          onClick={() => setIsAiPodcast(true)}
          className={cn("", {
            "bg-blue-800": isAiPodcast,
          })}
        >
          Use AI to generate Podcast
        </Button>
        <Button
          type="button"
          variant="plain"
          onClick={() => setIsAiPodcast(false)}
          className={cn("", {
            "bg-blue-800": !isAiPodcast,
          })}
        >
          Upload custom Audio
        </Button>
      </div>
          {isAiPodcast ?(<div className="flex flex-col gap-2.5">
          <Label className="text-16 font-bold text-white-1">
            AI Prompt to generate Podcast
          </Label>
          <Textarea 
            className="input-class font-light focus-visible:ring-offset-blue-800"
            placeholder='Provide text to generate audio'
            rows={5}
            value={props.voicePrompt}
            onChange={(e) => props.setVoicePrompt(e.target.value)}
          />
          <div className="mt-5 w-full max-w-[200px]">
            <Button 
              type="submit" 
              className="text-16 bg-blue-800 py-4 font-bold text-white-1" 
              onClick={generatePodcast}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  Generating
                  <Loader size={20} className="animate-spin ml-2" />
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </div>
        </div>):(<div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <Label className="text-16 font-bold text-white-1">
            Upload Audio File
          </Label>
          <div className="mt-2">
            <input
              type="file"
              accept="audio/*"
              onChange={uploadAudio}
              className="hidden"
              id="audio-upload"
            />
            <Label htmlFor="audio-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-blue-800">
                  {isUploading
                    ? "Uploading..."
                    : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-gray-500">MP3, WAV, OGG accepted</p>
              </div>
            </Label>
          </div>
        </div>
      </div>
    )}
      

      {props.audio && (
        <div className="mt-5">
          <audio
            controls
            src={props.audio}
            autoPlay
            className="w-full"
            onLoadedMetadata={(e) =>
              props.setAudioDuration(e.currentTarget.duration)
            }
          />
        </div>
      )}
    </>
  );
};

export default CreatePodcast;
