import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";
import randomstring from 'randomstring'

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log("file ==> ", file.name.split(".")[1]);

    const fileName = randomstring.generate();
    await fs.writeFile(`./public/uploads/${fileName}.${file.name.split(".")[1]}`, buffer);

    revalidatePath("/");

    return NextResponse.json({ success: true, payload: `${fileName}.${file.name.split(".")[1]}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, payload: e });
  }
}