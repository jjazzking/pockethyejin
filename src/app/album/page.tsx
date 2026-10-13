import type { Metadata } from "next";
import AlbumView from "./AlbumView";

export const metadata: Metadata = {
  title: "꿍진이 사진첩",
  description: "꿍진이 키우기에 나오는 혜진이와 정우 그림 모음",
};

export default function AlbumPage() {
  return <AlbumView />;
}
