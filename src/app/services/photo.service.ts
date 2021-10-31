import { Injectable } from '@angular/core';
import { Plugins, CameraResultType, Capacitor, FilesystemDirectory, CameraPhoto, CameraSource } from '@capacitor/core';

const {Camera, Filesystem, Storage} = Plugins;

@Injectable({
  providedIn: 'root'
})

export class PhotoService {
  public photos: Photo[] = [];
  private PHOTO_STORAGE = 'photos';

  constructor() { }

  public async addNewToGallery() {
    const capturedPhoto = await Camera.getPhoto(
      {
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 100
      });
    const savedImage = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImage);
    Storage.set({
        key: this.PHOTO_STORAGE,
        value: JSON.stringify(this.photos)
      });
  }

  public async loadSaved() {
    const photoList = await Storage.get({key: this.PHOTO_STORAGE});
    this.photos = JSON.parse(photoList.value) || [];
    for (let photo of this.photos){
      const readFile = await Filesystem.readFile(
        {
          path: photo.filepath,
          directory: FilesystemDirectory.Data
        }
      );
      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }
  }
  private async savePicture(cameraPhoto: CameraPhoto){
    const base64Data = await this.readAsBase64(cameraPhoto);
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: FilesystemDirectory.Data
    });
    return{
      filepath: fileName,
      webviewPath: cameraPhoto.webPath
    };
  }
  private async readAsBase64(cameraPhoto: CameraPhoto) {
    const response = await fetch(cameraPhoto.webPath);
    const blob = await response.blob();
    return await this.convertBlobToBase64(blob) as string;
  }

  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
    resolve(reader.result);
    };
    return reader.readAsDataURL(blob);
  })
}

export interface Photo{
  filepath: string;
  webviewPath: string;
}
