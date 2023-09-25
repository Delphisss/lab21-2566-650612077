import { checkToken } from "@/libs/checkToken";
import { getPrisma } from "@/libs/getPrisma";
import { NextResponse } from "next/server";

export const GET = async (request) => {
  const payload = checkToken();
  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid token",
      },
      { status: 401 }
    );
  }
  const { role, studentId } = payload;

  if (role === "ADMIN") {
    return NextResponse.json(
      {
        ok: true,
        message: "Only Student can access this API route",
      },
      { status: 403 }
    );
  }

  const prisma = getPrisma();
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId,
    },
    include: {
      course: true,
    },
    orderBy: {
      courseNo: "asc",
    },
  });

  return NextResponse.json({
    ok: true,
    enrollments,
  });
};

export const POST = async (request) => {
  const payload = checkToken();
  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid token",
      },
      { status: 401 }
    );
  }
  const { role, studentId } = payload;

  if (role === "ADMIN") {
    return NextResponse.json(
      {
        ok: true,
        message: "Only Student can access this API route",
      },
      { status: 403 }
    );
  }

  // Read body request & validate it
  const body = await request.json();
  const { courseNo } = body;
  if (typeof courseNo !== "string" || courseNo.length !== 6) {
    return NextResponse.json(
      {
        ok: false,
        message: "courseNo must contain 6 characters",
      },
      { status: 400 }
    );
  }

  const prisma = getPrisma();

  // 1. Check if courseNo does not exist in the database
  const courseExists = await prisma.course.findUnique({
    where: {
      courseNo: courseNo,
    },
  });
  if (!courseExists) {
    return NextResponse.json(
      {
        ok: false,
        message: "Course number does not exist",
      },
      { status: 400 }
    );
  }

  // 2. Check if the student has already enrolled in this course
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: studentId,
      courseNo: courseNo,
    },
  });

  if (existingEnrollment) {
    return NextResponse.json(
      {
        ok: false,
        message: "You already registered this course",
      },
      { status: 400 }
    );
  }

  // 3. If conditions above are not met, perform inserting data here
  await prisma.enrollment.create({
    data: {
      studentId: studentId,
      courseNo: courseNo,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "You has enrolled a course successfully",
  });
};

export const DELETE = async (request) => {
  const payload = checkToken();
  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid token",
      },
      { status: 401 }
    );
  }
  const { role, studentId } = payload;

  if (role === "ADMIN") {
    return NextResponse.json(
      {
        ok: true,
        message: "Only Student can access this API route",
      },
      { status: 403 }
    );
  }

  //read body request
  const body = await request.json();
  const { enrollmentId } = body;
  if (typeof enrollmentId !== "string") {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid enrollmentId",
      },
      { status: 400 }
    );
  }

  const prisma = getPrisma();

  try {
    await prisma.enrollment.delete({
      where: {
        id: enrollmentId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "You cannot drop from this course. You have not enrolled it yet!",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "You has dropped from this course. See you next semester.",
  });
};
