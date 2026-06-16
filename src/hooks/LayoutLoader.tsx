import FullScreenLoader from "@/components/FullScreenLoader";
import { useLoaderStore } from "@/store/loaderStore";

export default function LayoutLoader() {
  
  const isLoading = useLoaderStore((state) => state.isLoading)

  return (
    <FullScreenLoader visible={isLoading} />
  )
}