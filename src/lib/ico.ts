// .ico = 6-byte header + 16-byte directory entry per image + PNG payloads (supported since Windows Vista)
export async function buildIco(images: { size: number; blob: Blob }[]): Promise<Blob> {
  const datas = await Promise.all(images.map(async (i) => new Uint8Array(await i.blob.arrayBuffer())));
  const header = new DataView(new ArrayBuffer(6 + 16 * images.length));
  header.setUint16(2, 1, true); // type: icon
  header.setUint16(4, images.length, true);
  let offset = header.byteLength;
  images.forEach((img, i) => {
    const entry = 6 + i * 16;
    header.setUint8(entry, img.size >= 256 ? 0 : img.size);
    header.setUint8(entry + 1, img.size >= 256 ? 0 : img.size);
    header.setUint16(entry + 4, 1, true); // color planes
    header.setUint16(entry + 6, 32, true); // bits per pixel
    header.setUint32(entry + 8, datas[i].byteLength, true);
    header.setUint32(entry + 12, offset, true);
    offset += datas[i].byteLength;
  });
  return new Blob([header.buffer, ...(datas as BlobPart[])], { type: "image/x-icon" });
}
