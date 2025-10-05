import { Request, Response } from 'express'
import QRCode from 'qrcode'
import { ApiResponse } from '../types'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import prisma from '../utils/database'

export const getPublicSurvey = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params

  const survey = await prisma.survey.findFirst({
    where: {
      id,
      isActive: true,
      isPublic: true,
    },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          questionText: true,
          type: true,
          options: true,
          isRequired: true,
          order: true,
          conditionalLogic: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!survey) {
    throw new AppError('Survey not found or not accessible', 404)
  }

  // Check if survey has expired
  if (survey.expiresAt && survey.expiresAt < new Date()) {
    throw new AppError('Survey has expired', 400)
  }

  res.json({
    success: true,
    data: survey,
  } as ApiResponse)
})

export const generateQRCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { size = 200 } = req.query

  // Check if survey exists and is public
  const survey = await prisma.survey.findFirst({
    where: {
      id,
      isActive: true,
      isPublic: true,
    },
  })

  if (!survey) {
    throw new AppError('Survey not found or not accessible', 404)
  }

  const surveyUrl = `${req.protocol}://${req.get('host')}/survey/${id}`
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(surveyUrl, {
      width: Number(size),
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    res.json({
      success: true,
      data: {
        qrCode: qrCodeDataURL,
        url: surveyUrl,
      },
    } as ApiResponse)
  } catch (error) {
    throw new AppError('Failed to generate QR code', 500)
  }
})

export const generateEmbedCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { width = '100%', height = '600px' } = req.query

  // Check if survey exists and is public
  const survey = await prisma.survey.findFirst({
    where: {
      id,
      isActive: true,
      isPublic: true,
    },
  })

  if (!survey) {
    throw new AppError('Survey not found or not accessible', 404)
  }

  const surveyUrl = `${req.protocol}://${req.get('host')}/survey/${id}`
  
  const embedCode = `<iframe 
  src="${surveyUrl}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
</iframe>`

  const scriptCode = `<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${surveyUrl}';
    iframe.width = '${width}';
    iframe.height = '${height}';
    iframe.frameBorder = '0';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    
    var container = document.getElementById('survey-${id}');
    if (container) {
      container.appendChild(iframe);
    }
  })();
</script>

<!-- Place this div where you want the survey to appear -->
<div id="survey-${id}"></div>`

  res.json({
    success: true,
    data: {
      embedCode,
      scriptCode,
      url: surveyUrl,
      preview: `${surveyUrl}?preview=true`,
    },
  } as ApiResponse)
})

export const getSurveyStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params

  // Check if survey exists and is public
  const survey = await prisma.survey.findFirst({
    where: {
      id,
      isActive: true,
      isPublic: true,
    },
  })

  if (!survey) {
    throw new AppError('Survey not found or not accessible', 404)
  }

  const [totalResponses, completedResponses] = await Promise.all([
    prisma.response.count({
      where: { surveyId: id },
    }),
    prisma.response.count({
      where: {
        surveyId: id,
        isComplete: true,
      },
    }),
  ])

  const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0

  res.json({
    success: true,
    data: {
      totalResponses,
      completedResponses,
      completionRate: Math.round(completionRate * 100) / 100,
    },
  } as ApiResponse)
})
