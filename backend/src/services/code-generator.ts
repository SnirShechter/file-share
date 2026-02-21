// Code generation is handled entirely by the database via the bijective mapping approach.
// See Section 7 of the plan:
// - A SEQUENCE (file_code_seq) provides sequential internal_id values
// - A GENERATED ALWAYS AS column computes: lpad(((internal_id * 512927) % 1000000)::text, 6, '0')
// - This creates a collision-free bijective mapping from IDs to 6-digit codes
//
// No application-level code generation is needed.
// The code is automatically populated when inserting into the files table.
