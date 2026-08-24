import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'dummy_key_to_prevent_crash',
    dangerouslyAllowBrowser: true,
});

export async function calculateMatchScore(
    studentProfile: string,
    coverLetter: string,
    projectRole: string,
    projectDomain: string,
    projectExpectations: string
): Promise<{ score: number; feedback: string; matchedSkills: string[]; missingSkills: string[] }> {
    try {
        const prompt = `You are an expert technical recruiter analyzing a candidate's fit for a role.
        
        Project Role: ${projectRole}
        Project Domain: ${projectDomain}
        Project Expectations: ${projectExpectations || 'Standard industry expectations'}
        
        Candidate Profile Background: ${studentProfile}
        Candidate Cover Letter: ${coverLetter}
        
        Evaluate the candidate's alignment with the project requirements. 
        Return ONLY a JSON object with these fields:
        "score": a number from 0 to 100 representing the match percentage.
        "feedback": a brief 1-2 sentence constructive feedback on how they can improve their pitch for this specific role.
        "matchedSkills": an array of strings representing skills/keywords the candidate possesses that match the project.
        "missingSkills": an array of strings representing important skills/keywords for the project that the candidate is missing.`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const resultText = response.choices[0].message.content;
        const result = JSON.parse(resultText || "{}");
        
        return {
            score: result.score || 0,
            feedback: result.feedback || "Unable to generate feedback at this time.",
            matchedSkills: Array.isArray(result.matchedSkills) ? result.matchedSkills : [],
            missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : []
        };
    } catch (error) {
        console.error("AI Match Score Error:", error);
        throw new Error("Failed to calculate AI match score. Please try again later.");
    }
}
