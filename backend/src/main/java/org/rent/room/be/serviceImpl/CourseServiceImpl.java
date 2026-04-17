package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.course.CreateCourseRequest;
import org.rent.room.be.dto.request.course.UpdateCourseRequest;
import org.rent.room.be.dto.response.course.CourseResponse;
import org.rent.room.be.entity.ClassRoom;
import org.rent.room.be.entity.Course;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.CourseMapper;
import org.rent.room.be.repository.ClassRoomRepository;
import org.rent.room.be.repository.CourseRepository;
import org.rent.room.be.repository.EnrollmentRepository;
import org.rent.room.be.service.CourseService;
import org.rent.room.be.service.UserService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.net.URLConnection;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final ClassRoomRepository classRoomRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserService userService;
    private final CourseMapper courseMapper;

    @Override
    @Transactional
    public CourseResponse createCourse(CreateCourseRequest request) {
        ClassRoom classRoom = classRoomRepository.findById(request.getClassId())
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Course course = Course.builder()
                .classRoom(classRoom)
                .title(request.getTitle())
                .description(request.getDescription())
                .orderIndex(request.getOrderIndex())
                .fileUrls(request.getFileUrls())
                .build();

        return courseMapper.toResponse(courseRepository.save(course));
    }

    @Override
    public CourseResponse getCourse(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        ensureStudentEnrolledIfNeeded(course.getClassRoom());
        return courseMapper.toResponse(course);
    }

    @Override
    public PageResponse<CourseResponse> getCourses(UUID classId, int page, int size) {
        Sort sort = Sort.by("orderIndex").ascending().and(Sort.by("createdAt").ascending());
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Course> pageData;
        if (classId != null) {
            ClassRoom classRoom = classRoomRepository.findById(classId)
                    .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
            ensureStudentEnrolledIfNeeded(classRoom);
            pageData = courseRepository.findByClassRoom_ClassId(classId, pageable);
        } else {
            pageData = courseRepository.findAll(pageable);
        }

        Page<CourseResponse> responsePage = pageData.map(courseMapper::toResponse);

        return PageResponse.<CourseResponse>builder()
                .currentPage(page + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .data(responsePage.getContent())
                .build();
    }

    @Override
    @Transactional
    public CourseResponse updateCourse(UUID courseId, UpdateCourseRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        if (request.getTitle() != null) {
            course.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            course.setDescription(request.getDescription());
        }
        if (request.getOrderIndex() != null) {
            course.setOrderIndex(request.getOrderIndex());
        }
        if (request.getFileUrls() != null) {
            course.setFileUrls(request.getFileUrls());
        }

        return courseMapper.toResponse(courseRepository.save(course));
    }

    @Override
    @Transactional
    public void deleteCourse(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        courseRepository.delete(course);
    }

    @Override
    public Resource downloadFile(UUID courseId, String fileUrl) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        ensureStudentEnrolledIfNeeded(course.getClassRoom());

        // Kiểm tra xem fileUrl có trong danh sách fileUrls của course không
        if (course.getFileUrls() == null || !course.getFileUrls().contains(fileUrl)) {
            throw new AppException(ErrorCode.FILE_NOT_FOUND);
        }

        try {
            // Download file từ URL
            URI uri = URI.create(fileUrl);
            URL url = uri.toURL();
            URLConnection connection = url.openConnection();
            connection.setConnectTimeout(10000); // 10 seconds
            connection.setReadTimeout(30000); // 30 seconds

            try (InputStream inputStream = connection.getInputStream()) {
                byte[] fileBytes = inputStream.readAllBytes();
                String fileName = getFileNameFromUrl(fileUrl);
                
                log.info("Downloaded file: {} from course: {}", fileName, courseId);
                return new ByteArrayResource(fileBytes) {
                    @Override
                    public String getFilename() {
                        return fileName;
                    }
                };
            }
        } catch (IOException e) {
            log.error("Error downloading file from URL: {}", fileUrl, e);
            throw new AppException(ErrorCode.FILE_DOWNLOAD_ERROR);
        }
    }

    private String getFileNameFromUrl(String fileUrl) {
        try {
            URI uri = URI.create(fileUrl);
            String path = uri.getPath();
            String fileName = path.substring(path.lastIndexOf('/') + 1);
            // Nếu không có tên file, sử dụng tên mặc định
            if (fileName.isEmpty() || !fileName.contains(".")) {
                return "course_file_" + System.currentTimeMillis();
            }
            return fileName;
        } catch (Exception e) {
            return "course_file_" + System.currentTimeMillis();
        }
    }

    private void ensureStudentEnrolledIfNeeded(ClassRoom classRoom) {
        User currentUser;
        try {
            currentUser = userService.getCurrentUserEntity();
        } catch (AppException ex) {
            return;
        }

        if (currentUser.getRole() == null || currentUser.getRole().getRoleName() == null) {
            return;
        }

        String roleName = currentUser.getRole().getRoleName();
        if (!"STUDENT".equalsIgnoreCase(roleName)) {
            return;
        }

        boolean enrolled = enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(
                currentUser.getUserId(),
                classRoom.getClassId()
        );
        if (!enrolled) {
            throw new AppException(ErrorCode.QUIZ_ACCESS_DENIED);
        }
    }
}

