 
 
export default function DemoVideo({ videoId = 'Bx-j1QWu9Gg' }: { videoId?: string }) {
    return (
      <div className="w-full max-w-[100vw] lg:max-w-[1050px] mx-auto my-8 px-4 sm:px-6 lg:px-8">
        <div className="aspect-video relative rounded-lg overflow-hidden border border-gray-200 shadow-md">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    )
  }