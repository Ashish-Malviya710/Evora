const cloudinary = require('cloudinary').v2;

const cloudinaryConfigured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

const uploadToCloudinary = (buffer, folder = 'evora', mimeType = 'image/png') => {
    return new Promise((resolve) => {
        if (cloudinaryConfigured) {
            const stream = cloudinary.uploader.upload_stream(
                { folder, resource_type: 'image' },
                (error, result) => {
                    if (error || !result) {
                        console.warn('Cloudinary upload failed, using Data URL fallback:', error?.message);
                        const base64 = buffer.toString('base64');
                        resolve({ secure_url: `data:${mimeType};base64,${base64}` });
                    } else {
                        resolve(result);
                    }
                }
            );
            return stream.end(buffer);
        }

        // Fallback: Convert buffer to base64 Data URL so upload works 100% out-of-the-box
        const base64 = buffer.toString('base64');
        resolve({ secure_url: `data:${mimeType};base64,${base64}` });
    });
};

module.exports = { cloudinary, uploadToCloudinary };
