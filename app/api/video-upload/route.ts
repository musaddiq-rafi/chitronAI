import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, UploadStream } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';
import { buffer } from 'stream/consumers';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();
    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET  // Click 'View API Keys' above to copy your API secret
    });

    interface CloudinaryUploadResult {
        public_id: string;
        bytes: number;
        duration?: number;
        [key: string]: any;
    }

    export async function POST( request : NextRequest) {


        // const { userId } = await auth(); // ami nije await likhsi 
        // if (!userId) {
        //     return NextResponse.json ({error: 'Unauthorized'}, {status: 401});
        // }
        try{

                    // Check user
            const { userId } = await auth();
            if (!userId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            if(
                !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
                !process.env.CLOUDINARY_API_KEY ||
                !process.env.CLOUDINARY_API_SECRET
            ){
                return NextResponse.json({error: 'Cloudinary credintials not found'}, {status: 500});
            }
            const formData = await request.formData();
            const file = formData.get('file') as File | null;
            const title = formData.get('title') as string ;
            const description = formData.get('description') as string ;
            const originalSize = formData.get('originalSize') as string ;


            if (!file) {
                return NextResponse.json({error: 'File not found'}, {status: 400});
            }

         const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {   
                        resource_type: 'video',
                        folder: 'video-uploads',
                        transformation: [
                            {quality: 'auto', fetch_format: 'mp4'},
                        ],
                    }, 
                    (error,result)=> {
                        if(error) {
                            reject(error);
                        } else {
                            resolve(result as CloudinaryUploadResult);
                        }
                    }
                )
                .end(buffer);
            })
            const video = await prisma.video.create({
                data: {
                    title,
                    description,
                    originalSize,
                    publicId: result.public_id,
                    compressedSize: String(result.bytes),
                    duration: result.duration ?? 0,
                }
            });
            return NextResponse.json({
                publicId: result.public_id,
            }, {
                status: 200
            });

        } catch (error) {
            console.log("Upload Video Failed", error)
            return NextResponse.json({error: 'Upload Video failed'}, {status: 500});
            
        } finally {
            await prisma.$disconnect();
        }
        
    }
(async function() {


    
    // Upload an image
     const uploadResult = await cloudinary.uploader
       .upload(
           'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
               public_id: 'shoes',
           }
       )
       .catch((error) => {
           console.log(error);
       });
    
    console.log(uploadResult);
    
    // Optimize delivery by resizing and applying auto-format and auto-quality
    const optimizeUrl = cloudinary.url('shoes', {
        fetch_format: 'auto',
        quality: 'auto'
    });
    
    console.log(optimizeUrl);
    
    // Transform the image: auto-crop to square aspect_ratio
    const autoCropUrl = cloudinary.url('shoes', {
        crop: 'auto',
        gravity: 'auto',
        width: 500,
        height: 500,
    });
    
    console.log(autoCropUrl);    
})();