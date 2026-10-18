import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

const IMAGE_DIRECTORY = "lumicare-screening-images";

function getImageDirectory() {
  if (Platform.OS === "web") {
    throw new Error("Screening photos can be saved locally only in the mobile app.");
  }
  return new Directory(Paths.document, IMAGE_DIRECTORY);
}

export async function saveScreeningImage(sourceUri: string, imageId: string) {
  const directory = getImageDirectory();
  directory.create({ idempotent: true, intermediates: true });
  const source = new File(sourceUri);
  if (!source.exists) throw new Error("The selected screening image is unavailable.");

  const destination = new File(directory, `${imageId}.jpg`);
  await source.copy(destination, { overwrite: true });
  return destination.uri;
}

export function deleteScreeningImage(imagePath: string | null) {
  if (!imagePath || Platform.OS === "web") return;
  try {
    const file = new File(imagePath);
    if (file.exists) file.delete();
  } catch {
    // The database record may still be removed if its image is unavailable.
  }
}

export async function getScreeningImageDataUri(imagePath: string | null) {
  if (!imagePath || Platform.OS === "web") return null;
  const image = new File(imagePath);
  if (!image.exists) return null;
  return `data:${image.type || "image/jpeg"};base64,${await image.base64()}`;
}