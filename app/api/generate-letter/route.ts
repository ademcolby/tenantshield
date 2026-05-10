import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from '../../../lib/systemPrompt';

interface FormData {
  state: string;
  city: string;
  tenantName: string;
  tenantAddress: string;
  landlordName: string;
  landlordAddress: string;
  rentalPropertyAddress: string;
  depositAmount: string;
  vacatedDate: string;
  situation: string;
  subtypes: string[];
  specialCircumstances: string[];
  leaseDesignation: string;
  isRentStabilized: string;
}

// Format the form data into a clear user message for Claude
function buildUserMessage(data: FormData): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let vacatedFormatted = data.vacatedDate;
  if (data.vacatedDate) {
    const date = new Date(data.vacatedDate);
    vacatedFormatted = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  let message = `Generate a security deposit demand letter for the following situation:

LOCATION:
- State: ${data.state}
- City: ${data.city}`;

  if (data.isRentStabilized) {
    message += `\n- Rent-stabilized status: ${data.isRentStabilized}`;
  }

  message += `

TENANT:
- Name: ${data.tenantName}
- Current address: ${data.tenantAddress || 'not provided'}

LANDLORD:
- Name: ${data.landlordName}
- Address: ${data.landlordAddress || 'not provided'}

RENTAL PROPERTY:
- Address: ${data.rentalPropertyAddress}
- Security deposit amount: ${data.depositAmount ? '$' + data.depositAmount : 'not provided'}
- Date tenant vacated: ${vacatedFormatted}

DISPUTE TYPE: Security Deposit`;

  if (data.subtypes && data.subtypes.length > 0) {
    message += `\n\nSUB-TYPES SELECTED: ${data.subtypes.join(', ')}`;
  }

  if (data.specialCircumstances && data.specialCircumstances.length > 0) {
    message += `\n\nSPECIAL CIRCUMSTANCES: ${data.specialCircumstances.join(', ')}`;
  }

  if (data.leaseDesignation) {
    message += `\n\nLEASE DESIGNATION (for non-refundable fee): ${data.leaseDesignation}`;
  }

  message += `

TENANT'S DESCRIPTION OF WHAT HAPPENED:
${data.situation}

CURRENT DATE: ${today}

Generate the complete demand letter following all the rules in the system prompt. Output only the letter itself.`;

  return message;
}

export async function POST(request: NextRequest) {
  try {
    const formData: FormData = await request.json();

    // Verify API key is configured
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Basic validation - ensure required fields are present
    const requiredFields: (keyof FormData)[] = [
      'state', 'city', 'tenantName', 'landlordName',
      'rentalPropertyAddress', 'vacatedDate', 'situation'
    ];
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Build the user message
    const userMessage = buildUserMessage(formData);

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', response.status, errorData);
      return NextResponse.json(
        { error: 'Failed to generate letter. Please try again.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const letterText = data.content?.[0]?.text;

    if (!letterText) {
      console.error('No content in API response:', data);
      return NextResponse.json(
        { error: 'Failed to generate letter content.' },
        { status: 500 }
      );
    }

    // Check if the response is a special structured response
    if (letterText.startsWith('MISSING_INFORMATION') || letterText.startsWith('SCOPE_LIMITATION')) {
      return NextResponse.json({
        type: letterText.startsWith('MISSING_INFORMATION') ? 'missing_info' : 'out_of_scope',
        message: letterText
      });
    }

    // Return the generated letter
    return NextResponse.json({
      type: 'letter',
      letter: letterText,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating letter:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
